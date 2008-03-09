var Dhonishow = function(element, options, index){
	if(!element.id) element.id = "dhonishow_"+index;
	this.dom = new DhonishowDomTemplate(element, this);

	for(var option in (this.options = new DhonishowOptions(element))){ // invokes constructor class of each option
		this[option] = new window["Dhonishow_"+option](this.options[option], this);
	}
};

Dhonishow.prototype.registerUpdater = function(scope, func_name){
	this.updaters = this.updaters || [];
	var args = []; for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
	this.updaters.push({scope: scope, func_name: func_name, args: args});
	return scope[func_name];
};

Dhonishow.prototype.callUpdaters = function(){
	for (var i=0; i < this.updaters.length; i++) {
		this.updaters[i].scope[this.updaters[i].func_name].apply(this.updaters[i].scope, this.updaters[i].args);
	};
};

Dhonishow.prototype.animating = function(){
	return jQuery(this.dom.element).find("*:animated").length;
};

Dhonishow.extend = function(subClass, superClass){
	
	/*
		THX to Dustin Diaz and Ross Harmes for this great book:
		Pro JavaScript Design Patterns
		:)
	*/

	var F = function(){};
	F.prototype = superClass.prototype;
	subClass.prototype = new F();
	subClass.prototype.constructor = subClass;

	subClass.superclass = superClass.prototype;
	if (superClass.prototype.constructor == Object.prototype.constructor) {
		superClass.prototype.constructor = superClass;
	};
};

// ###########################################################################

jQuery.extend(Dhonishow.helper = {}, {
	image: function ( element ) {
		var img;
		element = (typeof element == "object" && element.nodeType == "undefined" || element.length) ? element[0] : element;
		if(element.nodeName.toLowerCase() != "img") {
			if((img = jQuery(element).find("img")) || (img = jQuery(element).filter("img"))) img.size() > 0 ? element = img[0] : true;
		}
		return element;
	},
	dimensions_give: function ( element ) {
		var image,
		width = jQuery(element).width(),
		height = jQuery(element).height();
		
		if(width == 0 || height == 0){
			if(element != (image = this.image(element))){
				width = image.width;
				height = image.height;
			}
		};
		
		return { width: width, height: height };
	},
	delayed_image_load: function ( image, func, scope ) {
		var preloaderImage = jQuery("<img>").load(function (){
			func.call(scope, image);
			jQuery(this).unbind("onload");
		});

		this.clone_attributes(image, preloaderImage);
		jQuery(image).replaceWith(preloaderImage);
	},
	delayed_dimensions_load: function(dimensions, func, scope){
		var image;
		if(!!!dimensions.width || !!!dimensions.height){
			if((image = jQuery(this.image(scope))).length > 0){
				this.delayed_image_load(image, func, scope);
			};
			return;
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
});

// ###########################################################################

var DhonishowOptions = function(element){
	
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
			if(typeof this[suboption[1].toLowerCase()] != "object") this[suboption[1].toLowerCase()] = {};
			this[suboption[1].toLowerCase()][suboption[2].toLowerCase()] = value;
		} else {
			this[option[1].toLowerCase()] = value;
		}
	};
	if( this.resize && this.center ) this.center = false;
	
};

// ###########################################################################

var DhonishowDomTemplate = function(element, parent){
	this.parent = parent;
	this.element = element;
	this.parent.current_index = 0;
	this.saveChildren();
	this.placeholders();
	this.invokeModules();
	
	this.parent.registerUpdater(this, "alt", this.giveModluePlaceholder("alt"));
	this.parent.registerUpdater(this, "current", this.giveModluePlaceholder("current"));
	this.parent.registerUpdater(this, "allpages", this.giveModluePlaceholder("allpages"));
	
};
Dhonishow.extend(DhonishowDomTemplate, Dhonishow);

DhonishowDomTemplate.prototype.template =
['<ol class="dhonishow-images">@images</ol>',
'<div class="dhonishow-navi">',
	'<p class="dhonishow-picture-alt">@alt</p>',
	'<div class="dhonishow-paging-buttons">',
		'<a class="dhonishow-next-button" title="Next">Next</a>',
		'<p class="dhonishow-paging">@current of @allpages</p>',
		'<a class="dhonishow-previous-button" title="Previous">Back</a>',
	"</div>",
'</div>'].join("");

DhonishowDomTemplate.prototype.elementWrapper = "<li class='element'></li>";

DhonishowDomTemplate.prototype.saveChildren = function(){
	this.children = jQuery(this.element).children();
	this.element.innerHTML = "";
};

DhonishowDomTemplate.prototype.placeholders = function(element){
	var modulePlaceholders = {};	
	$(this.element).append(this.template.replace(/@(\w*)/g, function(searchResultWithExpression, searchResult){
		modulePlaceholders[searchResult] = ".dhonishow_module_"+searchResult;
		return '<span class="dhonishow_module_'+searchResult+'"></span>';
	}));
	return this.modulePlaceholders = modulePlaceholders;
};

DhonishowDomTemplate.prototype.invokeModules = function(){
	for(var module in this.modulePlaceholders)
		this[module](this.giveModluePlaceholder(module));
};

DhonishowDomTemplate.prototype.giveModluePlaceholder = function(name){
	return jQuery(this.element).find(this.modulePlaceholders[name]);
};

DhonishowDomTemplate.prototype.images = function(placeholder){
	this.dhonishowElements = this.children || [];
	placeholder.replaceWith(this.dhonishowElements);
	jQuery(this.dhonishowElements).wrap(this.elementWrapper);
};

DhonishowDomTemplate.prototype.alt = function(placeholder){
	var alt, title, src;
	
	if(alt = jQuery(this.dhonishowElements[this.parent.current_index]).parent().find("*[alt]").attr("alt")){
		placeholder.text(alt);
		return;
	}
	if(title = jQuery(this.dhonishowElements[this.parent.current_index]).parent().find("*[title]").attr("title")){
		placeholder.text(title);
		return;
	}
	if(src = jQuery(this.dhonishowElements[this.parent.current_index]).parent().find("*[src]").attr("src")){
		var src = src.split('/');
		placeholder.text(src[src.length-1]);
		return;
	}
};

DhonishowDomTemplate.prototype.current = function(placeholder){
	placeholder.text(this.parent.current_index+1);
};

DhonishowDomTemplate.prototype.allpages = function(placeholder){
	placeholder.text(this.dhonishowElements.length);
};

// ###########################################################################

var Dhonishow_effect = function(effectName, parent){
	this.parent = parent;
	this.effect = new window["Dhonishow_effect_"+effectName](this);
	this.addObservers();
};

Dhonishow.extend(Dhonishow_effect, Dhonishow);
Dhonishow_effect.prototype.addObservers = function(){
	var parentElement = jQuery(this.parent.dom.element);
	parentElement.find(".dhonishow-previous-button").bind("click", this, this.previous);
	parentElement.find(".dhonishow-next-button").bind("click", this, this.next);
};

Dhonishow_effect.prototype.next = function(event){
	var _this = event.data;
	if(!_this.parent.animating()){
		var current = _this.parent.current_index;
		var next = ++_this.parent.current_index;
		_this.parent.callUpdaters();
		
		_this.effect.update(
			jQuery(_this.parent.dom.dhonishowElements[next]), 
			jQuery(_this.parent.dom.dhonishowElements[current]),
			_this.parent.options.duration
		);		
	}
};

Dhonishow_effect.prototype.previous = function(event){
	var _this = event.data;
	if(!_this.parent.animating()){
		var current = _this.parent.current_index;
		var next = --_this.parent.current_index;
		_this.parent.callUpdaters();
		
		_this.effect.update(
			jQuery(_this.parent.dom.dhonishowElements[next]), 
			jQuery(_this.parent.dom.dhonishowElements[current]),
			_this.parent.options.duration
		);		
	}	
};

// ###########################################################################

Dhonishow_effect_appear = function(parent){
	this.parent = parent;	
	this.parent.parent.hide.not_current();
};

Dhonishow.extend(Dhonishow_effect_appear, Dhonishow_effect);
Dhonishow_effect_appear.prototype.update = function(next_element, current_element, duration){
	current_element.parent().animate({ opacity: "toggle" }, duration*1000);
	next_element.parent().animate({ opacity: "toggle" }, duration*1000);
};

// ###########################################################################

Dhonishow_effect_resize = function(parent){
	this.parent = parent;
	
	var lenght = this.parent.parent.dom.dhonishowElements.length;
	jQuery(this.parent.parent.dom.dhonishowElements.get().reverse()).each(function(index){
		jQuery(this).parent().css("z-index", index+1);
		if(lenght-1 != index) jQuery(this).hide();
	});
	
	var dimensions = Dhonishow.helper.dimensions_give(this.parent.parent.dom.dhonishowElements[this.parent.parent.current_index]);
	jQuery(this.parent.parent.dom.element).find(".dhonishow-images").css("height", dimensions.height);
	jQuery(this.parent.parent.dom.element).css("width", dimensions.width);
	
};
Dhonishow.extend(Dhonishow_effect_resize, Dhonishow_effect);

Dhonishow_effect_resize.prototype.update = function(next_element, current_element, duration){
	var dimensions = Dhonishow.helper.dimensions_give(this.parent.parent.dom.dhonishowElements[this.parent.parent.current_index]);

	jQuery(this.parent.parent.dom.element).find(".dhonishow-images").animate({height: dimensions.height}, duration*1000);
	jQuery(this.parent.parent.dom.element).animate({width: dimensions.width}, duration*1000);
	
	current_element.fadeOut(duration*1000);
	next_element.fadeIn(duration*1000);
};

// ###########################################################################

var Dhonishow_duration = function(value, parent){};
Dhonishow.extend(Dhonishow_duration, Dhonishow);

// ###########################################################################

var Dhonishow_hide = function(value, parent){
	this.parent = parent;	
	for(var hide in value) this[hide](value[hide]);
	
	var previous_button = jQuery(this.parent.dom.element).find(".dhonishow-previous-button");
	var next_button = jQuery(this.parent.dom.element).find(".dhonishow-next-button");

	this.parent.registerUpdater(this, "previous_button", previous_button).call(this, previous_button);
	this.parent.registerUpdater(this, "next_button", next_button).call(this, next_button);
};
Dhonishow.extend(Dhonishow_hide, Dhonishow);

Dhonishow_hide.prototype.paging = function(hide){
	if(hide) jQuery(".dhonishow-paging", this.parent.dom.element).hide();
};

Dhonishow_hide.prototype.alt = function(hide){
	if(hide) jQuery(".dhonishow-picture-alt", this.parent.dom.element).hide();
};

Dhonishow_hide.prototype.navigation = function(hide){
	if(hide) jQuery(".dhonishow-navi", this.parent.dom.element).hide();
};

Dhonishow_hide.prototype.buttons = function(hide){
	if(hide) {
		jQuery(".dhonishow-previous-picture", this.parent.dom.element).hide();
		jQuery(".dhonishow-next-picture", this.parent.dom.element).hide();
	}
};

Dhonishow_hide.prototype.pagingbuttons = function(hide){
	if(hide) jQuery(".dhonishow-paging-buttons", this.parent.dom.element).hide();
};

Dhonishow_hide.prototype.previous_button = function(button){
	button.hide();
	if( this.parent.current_index != 0 ) button.show();
};

Dhonishow_hide.prototype.next_button = function(button){
	button.hide();
	if( this.parent.current_index != (this.parent.dom.dhonishowElements.length - 1) ) button.show();
};

Dhonishow_hide.prototype.not_current = function(){	
	var element, current = this.parent.current_index;
	
	jQuery(this.parent.dom.dhonishowElements).each(function(index){
		if(index != current)
			jQuery(this).parent().hide();
		else
			element = jQuery(this);
	});
	
	return element;
};

// ###########################################################################

var Dhonishow_center = function(value, parent){
	this.parent = parent;
	this.max = { width:0, height:0 };

	
	if (value){
		if (value.width || value.height){ 
			this.center(value); return; 
		}
		this.updateMax();
	}
};
Dhonishow.extend(Dhonishow_center, Dhonishow);

Dhonishow_center.prototype.updateMax = function () {
	var _this = this;	
	var elements_wraper = jQuery(this.parent.dom.element).find(".dhonishow-images");
	
	jQuery(this.parent.dom.element).find(".element").each(function (index) {
		var dimensions = Dhonishow.helper.dimensions_give(this);

		Dhonishow.helper.delayed_dimensions_load(dimensions, arguments.callee, this);
		
		if(!dimensions.width || !dimensions.height) return;
				
		jQuery(elements_wraper).css({
			height: _this.max.height = (_this.max.height < dimensions.height) ? dimensions.height : _this.max.height
		});
		
		jQuery(_this.parent.dom.element).css({ width: _this.max.width = (_this.max.width < dimensions.width) ? dimensions.width : _this.max.width });
		
		_this.parent.preloader.loadedOne(this);
	});
};

Dhonishow_center.prototype.center = function (value) {
	var _this = this;
	
	var elements_wraper = jQuery(this.parent.dom.element).find(".dhonishow-images").css("height", value.height+"px");
	jQuery(this.parent.dom.element).css("width", value.width+"px");
	
	var parent_dimensions = Dhonishow.helper.dimensions_give(elements_wraper);
	
	jQuery(this.parent.dom.element).find(".element").each(function (index) {
		var dimensions = Dhonishow.helper.dimensions_give(jQuery(this).children());

		Dhonishow.helper.delayed_dimensions_load(dimensions, arguments.callee, this);
		
		if(!dimensions.width || !dimensions.height) return;

		jQuery(this).css({
			paddingLeft: ( (parent_dimensions.width/2)-(dimensions.width/2) ),
			paddingTop: ( (parent_dimensions.height/2)-(dimensions.height/2) )
		});

		_this.parent.preloader.loadedOne(this);
	});
};

// ###########################################################################

var Dhonishow_autoplay = function(value, parent){
	this.parent = parent;
	this.create(value);
};

Dhonishow.extend(Dhonishow_autoplay, Dhonishow);

Dhonishow_autoplay.prototype.create = function(duration) {
	var _this = this;
	this.executer = setInterval(function(){
		_this.parent.current_index++;
		
		if(_this.parent.current_index == _this.parent.dom.dhonishowElements.length) {
			_this.parent.effect.effect.update(
				jQuery(_this.parent.dom.dhonishowElements[_this.parent.dom.dhonishowElements.length-1]), 
				jQuery(_this.parent.dom.dhonishowElements[_this.parent.current_index = 0]),
				_this.parent.options.duration
			);
		}else{
			_this.parent.effect.effect.update(
				jQuery(_this.parent.dom.dhonishowElements[_this.parent.current_index-1]), 
				jQuery(_this.parent.dom.dhonishowElements[_this.parent.current_index]),
				_this.parent.options.duration
			);
		}
		_this.parent.callUpdaters();
	}, duration*1000);
};

Dhonishow_autoplay.prototype.reset = function () {
	if(options.autoplay) {
		clearInterval(this.executer);
		this.executer = null;
		this.create(this.parent.options.autoplay);
	}
};

// ###########################################################################

var Dhonishow_preloader = function(value, parent){
	this.parent = parent;

	this.build(this.parent.dom.dhonishowElements.length);
	this.loadingInterval = this.setLoading();
	this.loadedCollection();
};
Dhonishow.extend(Dhonishow_preloader, Dhonishow);

Dhonishow_preloader.prototype.collection = [];

Dhonishow_preloader.prototype.build = function ( quantity ) {
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
	return jQuery(this.parent.dom.element).find(".dhonishow-images").before(this.template);
};

Dhonishow_preloader.prototype.setLoading = function () {
	var span = this.template.find("span")[0];
	return setInterval(function () {
		var length = span.innerHTML.length;
		(length == 3) ? span.innerHTML = "" : span.innerHTML += ".";
	}, 500);
};

Dhonishow_preloader.prototype.unsetLoading = function () {
	return clearInterval(this.loadingInterval);
};

Dhonishow_preloader.prototype.loadedCollection = function () {
	var _this = this;
	jQuery.each(this.collection, function () {
		$(_this.parent.dom.element).find(".dhonishow-preloader li:nth-child("+(this+2)+")").addClass("loaded");
	});
	this.loadedAll();
};

Dhonishow_preloader.prototype.loadedOne = function ( element ) {
	jQuery(element).addClass("loaded");
	this.loadedAll();
};

Dhonishow_preloader.prototype.loadedAll = function () {
	var _this = this;

	if(jQuery(_this.parent.dom.element).find(".loaded").size() == _this.parent.dom.dhonishowElements.length) {
		this.unsetLoading();
		jQuery(_this.parent.dom.element).find(".dhonishow-preloader").fadeOut(600);
	}
};

jQuery.fn.dhonishow = function(options){
	return jQuery.each(this, function(index){
		new Dhonishow(this, options, index);
	});
};

jQuery(function(){jQuery(".dhonishow").dhonishow();});