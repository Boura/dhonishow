/* The MIT License

Copyright (c) 2008 Stanislav Müller
http://lifedraft.de

*/

var Dhonishow = function(element, options, index) {
  var _this = this;
  
  if(!element.id) element.id = "dhonishow_"+index;
  if(this.elementsSet(element)){
    this.current_index = 0;
    this.queue = new this.queue();
    this.dom = new this.template(element, this);

    for(var option in (this.options = new this.options(element))) // invokes constructor class of each option
      if (this[option] != false) this[option] = new window["Dhonishow_"+option](this.options[option], this);

    /*
      TODO Kick this
    */
    jQuery(window).bind('load', function(event) { if(!_this.options.hide.navigation) jQuery(".dhonishow-navi", element).show(); });
  }
};

Dhonishow.prototype = {
  queue : function(){
    this.queues = {};
  },
  animating : function() {
    return this.dom.element.find("*:animated").length;
  },

  elementsSet : function(element) {
    if ( jQuery( element ).children().length > 0 ) return true;

    jQuery( element ).append("<p>Plese read instructions about using DhoniShow on <br />"+
      "<a href='http://dhonishow.de' style='color: #fff;' title='to DhoniShow site'>DhoniShow's website</a></p>").find("p").addClass("error");
    return false;
  }
};

Dhonishow.prototype.queue.prototype = {
  register : function(type, scope, func){
    this.queues[type] = this.queues[type] || [];
    var args = []; for (var i = 3; i < arguments.length; i++) args.push(arguments[i]);
    this.queues[type].push({scope: scope, func: func, args: args});
    return func;
  },

  invokeAll : function(type) {
    for (var i=0; i < this.queues[type].length; i++){
      this.queues[type][i].func.apply(this.queues[type][i].scope, this.queues[type][i].args);    
    }
  }
};
// ###########################################################################

Dhonishow.prototype.options = function(element){

  var suboption;
  this.preloader = true;
  this.duration = 0.6;
  this.center = true;
  this.hide = {
   paging: false,
   alt: false,
   navigation: false,
   buttons: false
  };
  this.effect = 'appear';

  var names = element.className.match(/(\w+|\w+-\w+)_(\w+)/g) || [];
  for (var i=0; i < names.length; i++) {
    var option = /(\w+|\w+-\w+)_(\w+)/.exec(names[i]), suboption;
    var value = option[2];

    if( /true|false/.test(value) ){
      value = !!( value.replace(/false/, "") ); // Wild hack
    } else if( (/dot/).test(value) ){
      value = Number( value.replace(/dot/, ".") );
    }

    if (suboption = option[1].match(/(\w+)-(\w+)/) ) {
      suboption[1] = suboption[1].toLowerCase();
      if(this[suboption[1]].constructor != Object)
        this[suboption[1]] = {};

      this[suboption[1].toLowerCase()][suboption[2].toLowerCase()] = value;
    } else {
      this[option[1].toLowerCase()] = value;
    }
  };
  if( this.resize && this.center ) this.center = false;
};


// ###########################################################################

Dhonishow.helper = {
  
  image: function ( element  ) {
    
    var img;
    element = (typeof element == "object" && element.nodeType == "undefined" || element.length) ? element[0] : element;
    if(element.nodeName.toLowerCase() != "img") {
      if((img = jQuery(element).find("img")) || (img = jQuery(element).filter("img"))){ 
        if(img.length > 0){
          element = img[0];
        }
      }
    }
    return element;
  },

  dimensions_give: function ( element, hund ) {

    var element = jQuery(element),
    image,
    width = element.width(),
    height = element.height();
    
    if(width == 0 || height == 0) {

      if(element[0] != (image = this.image(element))){
        width = image.width;
        height = image.height;
      } else {
        if(!height) height = element.children().height();
        if(!width) width = element.children().width();
      }
    }
    return { width: width, height: height };
  },

  delayed_image_load: function ( image, func, scope, args ) {
    var preloaderImage = jQuery("<img>").load(function (){
      if(args) {
        var arg = jQuery.makeArray(args);
        arg.push({width: this.width, height: this.height});
      }

      func.apply(scope, arg || []);
      this.onload = null;
      jQuery(this).unbind("onload");
    });
    
    this.clone_attributes(image, preloaderImage);
    jQuery(image).replaceWith(preloaderImage);

  },

  delayed_dimensions_load: function(dimensions, func, scope, args){
    var image;
    if(!!!dimensions.width || !!!dimensions.height){
      if( ( image = jQuery(this.image(scope)) ).length > 0 ) {
        this.delayed_image_load(image, func, scope, args);
      }
      /*if (jQuery.browser.msie) {
        var arg = jQuery.makeArray(args);
        
        arg.push({width: jQuery(window).width(), height: 500});
        func.apply(scope, arg);
      }*/
    }
  },

  clone_attributes: function (from, to ) {

    jQuery.each(from, function () {
      if(this.title && this.title.length > 0) to.attr("title", this.title);
      if(this.alt && this.alt.length > 0) to.attr("alt", this.alt);
      if(this.src && this.src.length > 0) to.attr("src", this.src);
    });
    return to;
  }
};

// ###########################################################################

Dhonishow.prototype.template = function(element, parent){
  this.parent = parent;
  this.element = jQuery(element);
  this.saveChildren();
  this.placeholders();
  this.invokeModules();

  this.parent.queue.register("updaters", this, this.alt, this.giveModluePlaceholder("alt"));
  this.parent.queue.register("updaters", this, this.current, this.giveModluePlaceholder("current"));
  this.parent.queue.register("updaters", this, this.allpages, this.giveModluePlaceholder("allpages"));

};

Dhonishow.prototype.template.prototype = {
  template : ['<ol class="dhonishow-elements">@images</ol>',
  '<div class="dhonishow-navi" style="display:none;">',
    '<p class="dhonishow-picture-alt">@alt</p>',
    '<div class="dhonishow-paging-buttons">',
      '<a class="dhonishow-next-button" title="Next">Next</a>',
      '<p class="dhonishow-paging">@current of @allpages</p>',
      '<a class="dhonishow-previous-button" title="Previous">Back</a>',
    "</div>",
  '</div>'].join(""),

  elementWrapper : "<li class='element'></li>",

  saveChildren : function(){
    this.children = jQuery(this.element).children();
    this.element.text("");
  },

  placeholders : function(element){
    var modulePlaceholders = {};
    jQuery(this.element).append(this.template.replace(/@(\w*)/g, function(searchResultWithExpression, searchResult){
      modulePlaceholders[searchResult] = ".dhonishow_module_"+searchResult;
      return '<span class="dhonishow_module_'+searchResult+'"></span>';
    }));
    return this.modulePlaceholders = modulePlaceholders;
  },

  invokeModules : function(){
    for(var module in this.modulePlaceholders)
      this[module](this.giveModluePlaceholder(module));
  },

  giveModluePlaceholder : function(name){
    return jQuery(this.element).find(this.modulePlaceholders[name]);
  },

  images : function(placeholder){
    var _this = this;
    this.children || [];

    placeholder.replaceWith(this.children);
    this.elements = jQuery(this.children).wrap(this.elementWrapper).parent();
  },

  alt : function(placeholder){
    var alt, title, src;
    if(alt = jQuery(this.elements[this.parent.current_index]).find("*[alt]").attr("alt")){
      if(jQuery(alt).filter("*").length){ placeholder.each(function(){ this.innerHTML = alt; }); return; }
      placeholder.text(alt);
      return;
    }
    if(title = jQuery(this.elements[this.parent.current_index]).find("*[title]").attr("title")){
      placeholder.text(title);
      return;
    }
    if(src = jQuery(this.elements[this.parent.current_index]).find("*[src]").attr("src")){
      var src = src.split('/');
      placeholder.text(src[src.length-1]);
      return;
    }
  },

  current : function(placeholder){
    placeholder.text(this.parent.current_index+1);
  },

  allpages : function(placeholder){
    placeholder.text(this.elements.length);
  }
};

// ###########################################################################

var Dhonishow_effect = function(effectName, parent){
  this.parent = parent;
  this.effect = new window["Dhonishow_effect_"+effectName](this);
  this.addObservers();
};

Dhonishow_effect.prototype = {
  addObservers : function(){
    /*
      TODO Rewrite the way events are binded to button elements
      it is to obstrusive
    */
  
    this.parent.dom.element.find(".dhonishow-previous-button").bind("click", this, this.previous);
    this.parent.dom.element.find(".dhonishow-next-button").bind("click", this, this.next);
  },

  next : function(event){
    var _this = event.data;
    if(!_this.parent.animating()){
      _this.update(_this.parent.current_index, ++_this.parent.current_index);
    }
  },

  previous : function(event){
    var _this = event.data;
    if(!_this.parent.animating()){
      _this.update(_this.parent.current_index, --_this.parent.current_index);
    }
  },

  update : function(next, current){
    this.parent.queue.invokeAll("updaters");
    this.effect.update(
        jQuery(this.parent.dom.elements[next]), 
        jQuery(this.parent.dom.elements[current]),
        this.parent.options.duration
    );
  }
};

// ###########################################################################

Dhonishow_effect_appear = function(parent){
  this.parent = parent;
  this.parent.parent.hide.not_current();
};

Dhonishow_effect_appear.prototype = {
  update : function(next_element, current_element, duration){
    current_element.animate({ opacity: "toggle" }, duration*1000);
    next_element.animate({ opacity: "toggle" }, duration*1000);
  }
};

// ###########################################################################

Dhonishow_effect_resize = function(parent){
  /*
    FIXME resize doesn't work properly anymore
  */
  this.parent = parent;
  jQuery(this.parent.parent.dom.elements.get().reverse()).each(function(index){
    jQuery(this).css( "z-index", index + 1 );
  });

};

Dhonishow_effect_resize.prototype = {
  update : function(next_element, current_element, duration){
    var dimensions = Dhonishow.helper.dimensions_give(next_element);

    this.parent.parent.dom.element.find(".dhonishow-elements").animate( { height: dimensions.height }, duration * 1000 );

    this.parent.parent.dom.element.animate( { width: dimensions.width }, duration * 1000 );

    current_element.fadeOut( duration * 1000 );
    next_element.fadeIn( duration * 1000 );
  }
};

// ###########################################################################

var Dhonishow_duration = function (value, parent) {
  if(value == 0) { parent.options.duration = 0.01; }
};

// ###########################################################################

var Dhonishow_hide = function(value, parent){
  this.parent = parent;
  for(var hide in value) this[hide](value[hide]);

  var previous_button = this.parent.dom.element.find(".dhonishow-previous-button");
  var next_button = this.parent.dom.element.find(".dhonishow-next-button");

  this.parent.queue.register("updaters", this, this.previous_button, previous_button).call(this, previous_button);
  this.parent.queue.register("updaters", this, this.next_button, next_button).call(this, next_button);
};

Dhonishow_hide.prototype = {
  paging : function(hide){
    if(hide) jQuery(".dhonishow-paging", this.parent.dom.element).hide();
  },

  alt : function(hide){
    if(hide) jQuery(".dhonishow-picture-alt", this.parent.dom.element).hide();
  },

  navigation : function(hide){
    if(hide) jQuery(".dhonishow-navi", this.parent.dom.element).hide();
  },

  buttons : function(hide){
    if(hide) {
      jQuery(".dhonishow-previous-button", this.parent.dom.element).hide();
      jQuery(".dhonishow-next-button", this.parent.dom.element).hide();
    }
  },

  previous_button : function(button){
    button.hide();
    if( this.parent.current_index != 0 && !this.parent.options.hide.buttons ) button.show();
  },

  next_button : function(button){
    button.hide();
    if( this.parent.current_index != (this.parent.dom.elements.length - 1) && !this.parent.options.hide.buttons) button.show();
  },

  not_current : function(){
    var element, current = this.parent.current_index;
  
    jQuery(this.parent.dom.elements).each(function(index){
      if(index != current)
        jQuery(this).hide();
      else
        element = jQuery(this);
    });
  
    return element;
  }
};

// ###########################################################################

var Dhonishow_center = function(value, parent){
  this.parent = parent;
  this.max = { width:0, height:0 };

  if (value && this.parent.options.effect != "resize"){
    this.center();
    if (value.width || value.height) jQuery(window).bind("load", this, this.dimensions_set);

  } else {
    this.update_max();
  }
};

Dhonishow_center.prototype = {
  center : function () {
    var _this = this;
    var elements_wraper = this.parent.dom.element.find(".dhonishow-elements");

    this.parent.dom.elements.each(function (index) {
    
      var dimensions = arguments[2] ? arguments[2] : Dhonishow.helper.dimensions_give(this);

      Dhonishow.helper.delayed_dimensions_load(dimensions, arguments.callee, this, arguments);

      if(!dimensions.width || !dimensions.height) return;

      _this.max.height = (dimensions.height > _this.max.height) ? dimensions.height : _this.max.height;
      _this.max.width = (dimensions.width > _this.max.width) ? dimensions.width : _this.max.width;

    
      jQuery(elements_wraper).css({ height: _this.max.height });
      _this.parent.dom.element.css({ width: _this.max.width });
    
      _this.parent.dom.elements.each(function(index){
        var element_dimensions = Dhonishow.helper.dimensions_give(this, "hund");
      
        jQuery(this).css({
          paddingLeft: ( (_this.max.width - element_dimensions.width) / 2 )+"px",
          paddingTop: ( (_this.max.height - element_dimensions.height) / 2 )+"px"
        });
      });

      _this.parent.preloader.loadedOne(index);

      if(index != _this.parent.current_index) jQuery(this).hide();
    });
  },

  update_max : function () {
    var _this = this;
    var elements_wraper = this.parent.dom.element.find(".dhonishow-elements");

    this.parent.dom.elements.each(function (index) {

      var dimensions = (arguments[2]) ? arguments[2] : Dhonishow.helper.dimensions_give(this);

      Dhonishow.helper.delayed_dimensions_load(dimensions, arguments.callee, this, arguments);

      if(!dimensions.width || !dimensions.height) return;

      _this.max.height = (dimensions.height > _this.max.height) ? dimensions.height : _this.max.height;
      _this.max.width = (dimensions.width > _this.max.width) ? dimensions.width : _this.max.width;

      jQuery(elements_wraper).css({ height: _this.max.height });
      _this.parent.dom.element.css({ width: _this.max.width });

      _this.parent.preloader.loadedOne(index);
    
      if(index != _this.parent.current_index) jQuery(this).hide();
    });

    if(this.parent.options.effect == "resize") jQuery(window).bind("load", function(){
      var dimensions = Dhonishow.helper.dimensions_give(_this.parent.dom.elements[_this.parent.current_index]);

      _this.parent.dom.element.find(".dhonishow-elements").css({height: dimensions.height});
      _this.parent.dom.element.css({width: dimensions.width});
    });
  },

  dimensions_set : function(event){
    var _this = event.data;
    var value = _this.parent.options.center;

    if(value.width) _this.parent.dom.element.css({ width:  value.width+"px" });
    if(value.height) _this.parent.dom.element.find(".dhonishow-elements").css({ height:  value.height+"px" });
  
    var element_dimensions = {
      width: new Number(value.width || _this.parent.dom.element.css("width").replace("px", "")),
      height: new Number(value.height || _this.parent.dom.element.find(".dhonishow-elements").css("height").replace("px", ""))
    };

    _this.parent.dom.elements.each(function(){
      var width = jQuery(this).width();
      var height = jQuery(this).height();

      var css = {};
      var offsetWidth = ( width - element_dimensions.width ) / 2;
      var offsetHeight = ( height - element_dimensions.height ) / 2;
    
      if(offsetWidth > 0) {
        css.paddingLeft = 0;
        css.marginLeft = offsetWidth - offsetWidth - offsetWidth + "px";
      } else css.paddingLeft = offsetWidth - offsetWidth - offsetWidth + "px";


      if(offsetHeight > 0){
        css.paddingTop = 0;
        css.marginTop = offsetHeight - offsetHeight - offsetHeight + "px";
      } else css.paddingTop = offsetHeight - offsetHeight - offsetHeight + "px";

      jQuery(this).css(css);
    });
  }
};

// ###########################################################################

var Dhonishow_autoplay = function(value, parent){
	this.parent = parent;
	this.create(value);
	this.parent.queue.register("updaters", this, this.reset);
};

Dhonishow_autoplay.prototype = {
  create : function(duration) {
    var _this = this;
    this.executer = setInterval(function(){
      _this.parent.current_index++;

      if(_this.parent.current_index == _this.parent.dom.elements.length) {
        _this.parent.effect.effect.update(
          jQuery(_this.parent.dom.elements[_this.parent.current_index = 0]), 
          jQuery(_this.parent.dom.elements[_this.parent.dom.elements.length-1]),
          _this.parent.options.duration
        );
      } else {
        _this.parent.effect.effect.update(
          jQuery(_this.parent.dom.elements[_this.parent.current_index]),
          jQuery(_this.parent.dom.elements[_this.parent.current_index-1]),
          _this.parent.options.duration
        );
      }
      _this.parent.queue.invokeAll("updaters");
    }, duration*1000);
  },

  reset : function () {
    clearInterval(this.executer);
    this.executer = null;
    this.create(this.parent.options.autoplay);
  }
};

// ###########################################################################

var Dhonishow_preloader = function(value, parent){
  this.parent = parent;

  if(value){
    this.build(this.parent.dom.elements.length);
    this.loadingInterval = this.setLoading();
  }
};

Dhonishow_preloader.prototype = {
  collection : [],

  build : function ( quantity ) {
    this.template = jQuery(['<ul class="dhonishow-preloader">',
      '<li class="dhonishow-preloader-loading">Loading <span>...</span></li>',
        (function () {
          var str = "";
          for(var i = 1; i<=quantity; i++) {
            str+=("<li>"+i+"</li>");
          }
          return str;
          })(),
          '</ul>'].join("") );
      return this.parent.dom.element.find(".dhonishow-elements").before(this.template);
  },

  setLoading : function () {
    var span = this.template.find("span")[0];
    return setInterval(function () {
      var length = span.innerHTML.length;
      (length == 3) ? span.innerHTML = "" : span.innerHTML += ".";
    }, 500);
  },

  unsetLoading : function () {
    return clearInterval(this.loadingInterval);
  },

  loadedOne : function ( position ) {
    if(this.parent.options.preloader){
      this.template.find("li").eq(position+1).addClass("loaded");
      this.loadedAll();
    }
  },

  loadedAll : function () {
    if(this.parent.dom.element.find(".loaded").size() == this.parent.dom.elements.length) {
      this.unsetLoading();
      this.parent.dom.element.find(".dhonishow-preloader").fadeOut(600);
    }
  }
};

jQuery.fn.dhonishow = function(options){
  return jQuery.each(this, function(index){
    new Dhonishow(this, options, index);
  });
};

jQuery(function(){jQuery(".dhonishow").dhonishow();});