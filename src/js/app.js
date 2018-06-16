
(function() {
  'use strict';

  /*
  --country format
  var url = 'https://newsapi.org/v2/top-headlines?' +
          'country=us&' +
          'apiKey=14ae7d089b5a402583f547c11078703f';

  --source format
  var url = 'https://newsapi.org/v2/top-headlines?' +
          'sources=bbc-news&' +
          'apiKey=14ae7d089b5a402583f547c11078703f';
  */

  /*
  ==================================================================
  global variables used across
  ==================================================================*/
  var newsAPIUrlBase = 'https://newsapi.org/v2/top-headlines', key = 'apiKey=14ae7d089b5a402583f547c11078703f';

  var app = {
    isLoading: true,
    spinner: document.querySelector('.loader'),
    headlinesList: [],
    container: document.querySelector('.headline-container'),
    cardTemplate: document.querySelector('.news-headline-template')
  };
  /*==================================================================*/

  /*
  ==================================================================
  service worker extra functions below 
  ==================================================================*/

  /* register sw*/
  app.registerServiceWorker = function(){
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.register('/service-worker.js').then(function(reg) {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      if (reg.waiting) {
        console.log('[ServiceWorker] is waiting - call update sw');
        app.updateWorker(reg.waiting);
        return;
      }

      if (reg.installing) {
        console.log('[ServiceWorker] is installing - call to track Installing sw');
        app.trackInstalling(reg.installing);
        return;
      }

      reg.addEventListener('updatefound', function() {
        console.log('[ServiceWorker] is installing - call to track Installing sw');
        app.trackInstalling(reg.installing);
      });
    });
  };

  /* track sw installing*/
  app.trackInstalling = function(worker) {
    worker.addEventListener('statechange', function() {
      console.log('[ServiceWorker] statechange -trackInstalling');
      if (worker.state == 'installed') {
        app.updateWorker(worker);
      }
    });
  };

  /* update sw*/
  app.updateWorker = function(worker) {
    console.log('[ServiceWorker] action to update worker called -skipWaiting');
    worker.postMessage({action: 'skipWaiting'});
  };
  /*==================================================================*/


  /*
  ==================================================================
  Headlines functions
  ==================================================================*/

  /* default -load nigeria news*/
  app.getNewsHeadlines = function(){

    var url = newsAPIUrlBase + '?country=ng&' + key;
    var req = new Request(url);
        fetch(req)
            .then(function(response) {
              response.json().then(function(result){
                if(result.status === 'ok'){
                  app.displayHeadlines(result.articles);
                  app.headlinesList = result.articles;
                  app.saveHealines();
                }
              })
            })      
  }

  /* display headlines*/
  app.displayHeadlines = function(headlinesList){
    // console.log(headlinesList);
        
    headlinesList.forEach(function(data) {
      //get sample card mock on dom
      let card = app.cardTemplate.cloneNode(true);
      // console.log(data);
      if (card) {
        card.classList.remove('news-headline-template');
        card.removeAttribute('hidden');
        //set card content        
        card.querySelector('a').href = data.url;
        card.querySelector('a').target = '_blank';
        card.querySelector('img').src = (data.urlToImage !== null)? data.urlToImage : "src/images/noimage.png";
        card.querySelector('.title').textContent = data.title;
        // card.querySelector('.description').textContent = data.description;
        // card.querySelector('.author').textContent = data.author;
        card.querySelector('.source').textContent = data.source.name;
        card.querySelector('.date').textContent = app.formatDate(data.publishedAt);

        app.container.appendChild(card);
      }
    });
    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  }

  /* save headlines locally */
  app.saveHealines = function() {
    window.localforage.setItem('Headlines', app.headlinesList);
  };
  /*==================================================================*/

  /*
  ==================================================================
  Helper functions
  ==================================================================*/

  /*format date*/
  app.formatDate = function(d){
    let date = new Date(d);
    return `${date.toDateString()}, ${date.toLocaleTimeString()}`;
  }
  /*==================================================================*/

  

  /* app.init */
  app.init = function(){
    //call sw registration
    app.registerServiceWorker();

    //start app here
    window.localforage.getItem('Headlines', function(err, headlines) {
      if (headlines) {
        console.log('offline source -> ')
        app.headlinesList = headlines;
        //display ui
        app.displayHeadlines(headlines);

      } else {

        console.log('online source -> ');
        app.getNewsHeadlines();
        //fetch headlines
        // var url = 'https://newsapi.org/v2/top-headlines?' +
        //   'country=ng&' +
        //   'apiKey=14ae7d089b5a402583f547c11078703f';
        // var req = new Request(url);
        // fetch(url)
        //     .then(function(response) {
        //        response.json().then(function(result){
        //         if(result.status === 'ok'){
        //           app.displayHeadlines(result.articles);
        //           window.localforage.setItem('storedNews',result.articles);
        //         }
        //        })
        //     }) 
      }
    });   

    // poll = setInterval(function(){
    //   console.log('..polling')
    //   app.getNewsHeadlines();      
    // },15000); 
  }

  document.addEventListener('DOMContentLoaded', function() {
    app.init();
  });
  

})();
