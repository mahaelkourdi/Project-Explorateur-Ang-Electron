
;(function(document, window, undefined) {

	'use strict';


		var html_ref = null,
			div_ref = null,
			div_half_width = null,
			div_half_height = null,
			img_ref = null,
			img_original_width = null,
			img_original_height = null,
			img_current_width = null,
			img_current_height = null,
			img_current_left = null,
			img_current_top = null,
			zoom_control_refs = {},
			zoom_levels = [],
			zoom_level_count = 0,
			zoom_limit = null,
			zoom_min_width = null,
			zoom_max_width = null,
			zoom_origin_coords = [],
			zoom_origin_distance = null,
			zoom_origin_width = null,
			move_origin_cords = null,
			move_origin_left = null,
			move_origin_top = null,
			click_last = 0;

		if (typeof(Math) === 'undefined') {
			return false; 
		}


		function addEventListener(obj, type, fn) {
			if (obj.addEventListener) {
				obj.addEventListener(type, fn, false);
			} else if (obj.attachEvent) {
				obj['e'+type+fn] = fn;
				obj[type+fn] = function() { obj['e'+type+fn](window.event); }
				obj.attachEvent('on'+type, obj[type+fn]);
			} else {
				obj['on'+type] = obj['e'+type+fn];
			}
		}

		function removeEventListener(obj, type, fn) {
			if (obj.removeEventListener) {
				obj.removeEventListener(type, fn, false);
			} else if (obj.detachEvent) {
				try {
					obj.detachEvent('on'+type, obj[type+fn]); 
				} catch(e) {
				}
			} else {
				obj['on'+type] = null;
			}
		}

		function preventDefault(e) {
			if (e.preventDefault) {
				e.preventDefault();
			} else {
				e.returnValue = false;
			}
			return false;
		}

		function preventPropagationAndDefault(e) {
			if (e.stopPropagation) {
				e.stopPropagation();
			}
			return preventDefault(e);
		}

		function event_move_coords(e) {
			var coords = [];
			if (e.touches && e.touches.length) {
				coords[0] = e.touches[0].clientX;
				coords[1] = e.touches[0].clientY;
			} else {
				coords[0] = e.clientX;
				coords[1] = e.clientY;
			}
			return coords;
		}

		function event_zoom_coords(e) {
			var coords = [0, 0];
			if (e.touches && e.touches.length >= 2) {
				coords[0] = ((e.touches[0].clientX + e.touches[1].clientX) / 2);
				coords[1] = ((e.touches[0].clientY + e.touches[1].clientY) / 2);
			}
			return coords;
		}

		function event_zoom_distance(e) { 
			var distance = 0;
			if (e.touches && e.touches.length >= 2) {
				distance = Math.sqrt(
					(e.touches[0].clientX-e.touches[1].clientX) * (e.touches[0].clientX-e.touches[1].clientX) +
					(e.touches[0].clientY-e.touches[1].clientY) * (e.touches[0].clientY-e.touches[1].clientY));
			}
			return distance;
		}



		html_ref = document.getElementsByTagName('html');
		if (html_ref[0]) {
			html_ref[0].className = html_ref[0].className + ' js-enabled';
		}

		function image_zoom_update(new_width) {


				var new_limit = 0,
					new_height = 0,
					ratio = 0;

				if (new_width == zoom_max_width) new_limit = (new_limit | 1);
				if (new_width == zoom_min_width) new_limit = (new_limit | 2);


				if (new_limit != 0 && new_limit != 3 && new_limit != zoom_limit && zoom_limit !== null) { // At a limit (not both), has just hit that limit, and isn't happening on page load.

					div_ref.style.opacity = 0.5;
					setTimeout(function() {div_ref.style.opacity = 1;}, 150);

				}


				if (new_limit != zoom_limit) { 

					if (new_limit & 1) {
						zoom_control_refs['in-on'].style.display = 'none';
						zoom_control_refs['in-off'].style.display = 'block';
					} else {
						zoom_control_refs['in-on'].style.display = 'block';
						zoom_control_refs['in-off'].style.display = 'none';
					}

					if (new_limit & 2) {
						zoom_control_refs['out-on'].style.display = 'none';
						zoom_control_refs['out-off'].style.display = 'block';
					} else {
						zoom_control_refs['out-on'].style.display = 'block';
						zoom_control_refs['out-off'].style.display = 'none';
					}

					zoom_limit = new_limit;

				} else if (new_limit != 0) { 

					return false;

				}

				new_height = ((img_original_height / img_original_width) * new_width);

				if (img_current_left === null) { 
					img_current_left = (div_half_width - (new_width  / 2));
					img_current_top  = (div_half_height - (new_height / 2));

				} else {

					ratio = (new_width / img_current_width);

					img_current_left = (div_half_width - ((div_half_width - img_current_left) * ratio));
					img_current_top  = (div_half_height - ((div_half_height - img_current_top)  * ratio));

				}

				img_current_width  = new_width;
				img_current_height = new_height;

				img_ref.style.width  = img_current_width + 'px'; 
				img_ref.style.height = img_current_height + 'px';
				img_ref.style.left   = img_current_left + 'px';
				img_ref.style.top    = img_current_top + 'px';


				return true;

		}

		function image_zoom_event(e) {


				var new_width = ((event_zoom_distance(e) / zoom_origin_distance) * zoom_origin_width);

				if (new_width < zoom_min_width) new_width = zoom_min_width;
				if (new_width > zoom_max_width) new_width = zoom_max_width;

				if (image_zoom_update(new_width) === false) { 

					zoom_origin_distance = event_zoom_distance(e);
					zoom_origin_width = new_width;

				}


				return preventDefault(e);

		}

		function image_zoom_change(change) {



				var current_zoom = 0,
					new_zoom = null,
					new_width = null,
					k = 0;

				for (k = zoom_level_count; k >= 0; k--) {
					if (zoom_levels[k] <= img_current_width) {
						current_zoom = k;
						break;
					}
				}


				new_zoom = (current_zoom + change);
				if (new_zoom < 0) new_zoom = 0;
				if (new_zoom > zoom_level_count) new_zoom = zoom_level_count;

				new_width = zoom_levels[new_zoom];

				image_zoom_update(new_width);

		}

		function image_zoom_in(e) {
			image_zoom_change(1);
			return preventPropagationAndDefault(e);
		}

		function image_zoom_out(e) {
			image_zoom_change(-1);
			return preventPropagationAndDefault(e);
		}

		function scroll_event(e) {

			var wheelData = 0;
			if (e.wheelDelta) wheelData = e.wheelDelta / -40;
			if (e.deltaY) wheelData = e.deltaY;
			if (e.detail) wheelData = e.detail;

			image_zoom_change(wheelData > 0 ? -1 : 1);

			return preventPropagationAndDefault(e);

		}



		function image_move_update(new_left, new_top) {



				var max_left = (div_half_width - img_current_width),
					max_top = (div_half_height - img_current_height);

				if (new_left > div_half_width)  { new_left = div_half_width; }
				if (new_top  > div_half_height) { new_top  = div_half_height; }
				if (new_left < max_left)        { new_left = max_left; }
				if (new_top  < max_top)         { new_top  = max_top;  }


				img_current_left = new_left;
				img_current_top  = new_top;

				img_ref.style.left = img_current_left + 'px';
				img_ref.style.top  = img_current_top + 'px';

		}

		function image_move_event(e) {


				var new_cords = event_move_coords(e),
					new_left = (move_origin_left + (new_cords[0] - move_origin_cords[0])),
					new_top = (move_origin_top + (new_cords[1] - move_origin_cords[1]));

				image_move_update(new_left, new_top);


				return preventDefault(e);

		}


		function image_event_start(e) {

				image_event_end();

				if (e.type === 'touchstart' && e.touches.length == 2) { 

						zoom_origin_coords = event_zoom_coords(e);
						zoom_origin_distance = event_zoom_distance(e);
						zoom_origin_width = img_current_width;


						addEventListener(img_ref, 'touchmove', image_zoom_event);
						addEventListener(img_ref, 'touchend', image_event_end);

				} else {


						var now = new Date().getTime();
						if (click_last > (now - 200)) {
							image_zoom_in(e);
						} else {
							click_last = now;
						}

						move_origin_left = img_current_left;
						move_origin_top = img_current_top;
						move_origin_cords = event_move_coords(e);

						if (e.type === 'touchstart') {

							addEventListener(img_ref, 'touchmove', image_move_event);
							addEventListener(img_ref, 'touchend', image_event_end);

						} else {

							addEventListener(document, 'mousemove', image_move_event);
							addEventListener(document, 'mouseup', image_event_end);

						}

				}


				if (e.type !== 'touchstart') {

					return preventDefault(e);

				} else if (e.target == img_ref) {

					return preventDefault(e); 

				} else if (e.touches && e.touches.length > 1) {

					return preventDefault(e); 

				} else {

					return true;

				}

		}

		function image_event_end() {

			removeEventListener(img_ref, 'touchmove', image_zoom_event);
			removeEventListener(img_ref, 'touchmove', image_move_event);
			removeEventListener(document, 'mousemove', image_move_event);

			removeEventListener(img_ref, 'touchend', image_event_end);
			removeEventListener(document, 'mouseup', image_event_end);

		}


		function keyboard_event(e) {

			var keyCode = (e ? e.which : window.event.keyCode);

			if (keyCode === 37 || keyCode === 39) { 

				image_move_update((img_current_left + (keyCode === 39 ? 50 : -50)), img_current_top);

			} else if (keyCode === 38 || keyCode === 40) { 

				image_move_update(img_current_left, (img_current_top + (keyCode === 40 ? 50 : -50)));

			} else if (keyCode === 107 || keyCode === 187 || keyCode === 61) { 

				image_zoom_in(e);

			} else if (keyCode === 109 || keyCode === 189) { 

				image_zoom_out(e);

			}

		}

		function init() {

			div_ref = document.getElementById('image-zoom-wrapper');
			img_ref = document.getElementById('image-zoom');

			if (div_ref && img_ref) {


					var div_style,
						div_width,
						div_height,
						width,
						height,
						button,
						buttons,
						name,
						len,
						k,
						wheel;


					try {
						div_style = getComputedStyle(div_ref, '');
						div_half_width = div_style.getPropertyValue('width');
						div_half_height = div_style.getPropertyValue('height');
					} catch(e) {
						div_half_width = div_ref.currentStyle.width;
						div_half_height = div_ref.currentStyle.height;
					}

					div_half_width = Math.round(parseInt(div_half_width, 10) / 2);
					div_half_height = Math.round(parseInt(div_half_height, 10) / 2);


					img_original_width = img_ref.width;
					img_original_height = img_ref.height;


					buttons = [{'t' : 'in', 's' : 'on'}, {'t' : 'in', 's' : 'off'}, {'t' : 'out', 's' : 'on'}, {'t' : 'out', 's' : 'off'}];

					for (k = 0, len = buttons.length; k < len; k = k + 1) {

						button = buttons[k];
						name = button.t + '-' + button.s;

						zoom_control_refs[name] = document.createElement('div');
						zoom_control_refs[name].className = 'zoom-control zoom-' + button.t + ' zoom-' + button.s;

						if (button.t === 'in') {
							addEventListener(zoom_control_refs[name], 'mousedown', image_zoom_in);
							addEventListener(zoom_control_refs[name], 'touchstart', image_zoom_in);
						} else {
							if (button.s === 'on') {
								addEventListener(zoom_control_refs[name], 'mousedown', image_zoom_out);
								addEventListener(zoom_control_refs[name], 'touchstart', image_zoom_out);
							} else {
								addEventListener(zoom_control_refs[name], 'mousedown', preventPropagationAndDefault);
								addEventListener(zoom_control_refs[name], 'touchstart', preventPropagationAndDefault);
							}
						}

						if (button.s === 'on') {
							try {
								zoom_control_refs[name].style.cursor = 'pointer';
							} catch(err) {
								zoom_control_refs[name].style.cursor = 'hand'; 
							}
						} else {
							zoom_control_refs[name].style.cursor = 'auto';
						}

						div_ref.appendChild(zoom_control_refs[name]);

					}

					div_width = (div_half_width * 2);
					div_height = (div_half_height * 2);

					width = img_original_width;
					height = img_original_height;

					zoom_levels[zoom_levels.length] = Math.round(img_original_width * 1.75); 
					zoom_levels[zoom_levels.length] = width;

					while (width > div_width || height > div_height) {
						width = (width * 0.75);
						height = (height * 0.75);
						zoom_levels[zoom_levels.length] = Math.round(width);
					}

					zoom_levels.reverse(); 

					zoom_level_count = (zoom_levels.length - 1);

					zoom_min_width = zoom_levels[0];
					zoom_max_width = zoom_levels[zoom_level_count];

					image_zoom_update(zoom_levels[0]);


					img_ref.style.visibility = 'visible';

					div_ref.className = div_ref.className + ' js-active';


					wheel = 'onwheel' in document.createElement('div') ? 'wheel' :
							document.onmousewheel !== undefined ? 'mousewheel' : 
							'DOMMouseScroll'; // 

					addEventListener(div_ref, wheel, scroll_event);
					addEventListener(div_ref, 'mousedown', image_event_start);
					addEventListener(div_ref, 'touchstart', image_event_start);


					div_ref.tabIndex = '0';

					addEventListener(div_ref, 'keyup', keyboard_event);

			}

		}

		addEventListener(window, 'load', init);

})(document, window);
