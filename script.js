var app= angular.module('app', ['ngRoute']);

const {remote}= require('electron');

app.service('image',function(){
	var imagePath="";
	this.setImagepath=function(path){
		imagePath=path;
	};
	this.getImagePath=function(){
		return imagePath;
	};

});

app.config(function($routeProvider){
	$routeProvider.when('/',{
		templateUrl:`${__dirname}/components/home/home.html`,
		controller: 'homeCtrl'
	}).when('/edit',{
		templateUrl:`${__dirname}/components/editImage/editImage.html`,					
		controller:'editCtrl'															
	}).otherwise({
		template:'404 Error'
	});
});

/*-----------------------------------------------------------------------------------
ce programme permet de réaliser les fonctionnalités du head : réduire, rétablir,fermer
------------------------------------------------------------------------------------*/

app.controller('headCtrl',function($scope){
	var win=remote.getCurrentWindow();
	$scope.close=function(){
		win.close();

	};
	$scope.maximize=function(){
		win.isMaximized() ? win.unmaximize() : win.maximize();
	};
	$scope.minimize=function(){
		win.minimize();
	};
});




app.controller('homeCtrl',function($scope, $location,image){

	/*---------------------------------------------------------------------------------
			Fonction qui permet de séléctionner une image
	--------------------------------------------------------------------------------*/
	$scope.pickFile= function(){
		var {dialog}= remote;

		dialog.showOpenDialog({
			properties:['openFile'],
			filters:[{
				name:'Images',
				extensions:['png','jpeg','jpg','gif'] 					// on peut rajouter d'autres types d'image
			}]
		}, function(file){
			if (file === undefined) return;
			if(!!file){													// si le fichier existe
				var path = file[0];
				image.setImagepath(path);
				$location.path('/edit');

				$scope.$apply();
		}});


	};

	/*--------------------------------------------------------------------------------
			Fonction qui permet de créer un dossier 
	---------------------------------------------------------------------------------*/

	$scope.createDirectory = function() {

		const testFolder = './assets/';
		const fs = require('fs');

		var NbRep = 0;

		fs.readdirSync(testFolder).forEach(file => {
			NbRep++;
		});

		NbRep++;

		fs.mkdir("./assets/" + NbRep, (callback) => console.log(callback));
	}
	
});

/*-----------------------------------------------------------------------------
			Fonction qui affiche l'image séléctionnée par l'utilisateur
------------------------------------------------------------------------------*/
app.controller('editCtrl', function($scope,image){
	$scope.imagePath=image.getImagePath();

});

