;( function( $, window, document, undefined ) {

	"use strict";
		var pluginName = "CcDataTable";
		
		function GetMessageBus(){
			var bus={};
			var o = $({});
			$.each({
				trigger: 'publish',
				on: 'subscribe',
				off: 'unsubscribe'
			}, function(key, val) {
				bus[val] = function() {
					o[key].apply(o, arguments);
				};
			});
			return bus;
		}
		

		// The actual plugin constructor
		function Plugin ( element, options, pluginIntanceName ) {
			var me= this;
			this.element = element;
			this._name = pluginIntanceName;

			var defaults = {
				pageLength: 25
			};
			var paginationControls={
				firstPageControlId: 'first',
				lastPageControlId: 'last',
				prePageControlId:'prePage',
				nextPageControlId: 'nextPage',
				selectedPageControlId: 'selectedPage',
				totalRecordsControlId: 'totalRecords',
				containerId: 'paginationContainer'
			 };
			this.paginationTemplate='<div class="totalRecords" id="{{totalRecordsControlId}}">Total Records : 0</div> \
        <div class="paginationTools" id="{{containerId}}"> \
          <button class="fa fa-fast-backward paginationIcon paginationDisabled" id="{{firstPageControlId}}"></button> \
		  <button class="fa fa-step-backward paginationIcon paginationDisabled" id="{{prePageControlId}}"></button> \
          <select id="{{selectedPageControlId}}"></select> \
          <button class="fa fa-step-forward paginationIcon" id="{{nextPageControlId}}"></button> \
          <button class="fa fa-fast-forward paginationIcon" id="{{lastPageControlId}}"></button> \
		</div>';

			this.settings = $.extend( {}, defaults, options );
			this._defaults = defaults;
		

			//create unique id for each pagination control and apply id to the template
			this.settings.paginationControls=$.extend({},paginationControls);
			$.each(paginationControls,function(k,v){
				var id=me.getUniqueId(v);
				me.paginationTemplate = me.replaceKeyWithValue(me.paginationTemplate,k,id);
				var idWithSyntax= id.charAt(0)==='#' ? id : '#'+id;
				me.settings.paginationControls[k]=idWithSyntax;
			});
			console.log(this._name+' paginationTemplate: ',me.paginationTemplate);

			//create dom
			me._defaults.dom="";
			me._domRootClassName='wrapper_'+me.getUniqueId('dt');

			this.settings.dom=me.getCustomDom();
			this._messageBus= GetMessageBus();

			//create datatable instance, then init this plugin
			this.table= $(this.element).on( 'init.dt', function (){
				me.init();
			}).DataTable(this.settings);
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {
			init: function() {
				this.setupCustomMessageHandler();
				this.renderElements();
				this.setupEventsListener();
			},
			findElement: function(key){
				return $('.'+this._domRootClassName).find(key);
			},
			replaceKeyWithValue: function(inputStringTemplate,key,value){
				var regex = new RegExp("{{"+key+"}}", "gi");
				return inputStringTemplate.replace(regex, value);
			},
			getCustomDom: function(){
				var me=this;
				var domArray=[];
				var startTag= '<';
				var endTag='>';

				domArray.push(startTag+'"'+me._domRootClassName+'"');

				$.map(me.settings.sections,function(v,k){
					console.log(v,k);
					var isTable= v.type ? v.type.toLowerCase()==='table' : false;
					var className=(v.class && v.class.trim().length>0) ? v.class : me.getUniqueId(k);
					v.class=className;
					
					if(isTable){
						domArray.push("t");
						endTag="";
					}else{
						domArray.push(startTag);
						domArray.push('"');
						domArray.push(className+'"');
					}
	
					$.map(v.children,function(cv,ck){
						var isTable1= cv.type ? cv.type.toLowerCase()==='table' : false;
						var cclassName= (cv.class && cv.class.trim().length>0) ? cv.class : me.getUniqueId(k);
						cv.class=cclassName;

						if(isTable1){
							domArray.push("t");
						}else{
							domArray.push(startTag+'"'+cclassName+'">');
						}
					});
	
					domArray.push(endTag);
				});

				//ending tag for the container
				domArray.push(endTag);

				return domArray.join('');
			},
			getUniqueId: function(key){
				var randNum= Math.floor((Math.random() * 1000) + 1);
				return 'id_'+key+'_'+new Date().valueOf()+'_'+randNum;
			},
			enableOrDisablePaginationControls: function(){
				var me= this;
				
				var selectId=  this.settings.paginationControls.selectedPageControlId;
				var firstId=  this.settings.paginationControls.firstPageControlId;
				var preId=  this.settings.paginationControls.prePageControlId;
				var lastId=  this.settings.paginationControls.lastPageControlId;
				var nextId=  this.settings.paginationControls.nextPageControlId;
				var containerId= this.settings.paginationControls.containerId;
				var info = me.table.page.info();

				console.log('enableOrDisablePaginationControls ==>page info: ', info);
				//set current page on the dropdown list
				me.findElement(selectId).val(info.page);

				var currentPage= info.page +1;

				console.log('current page# '+ currentPage+'/'+info.pages);
				var hasPrePage= (currentPage-1) >0;
				if(hasPrePage){
					//enable prev and first
					me.findElement(firstId).attr('disabled',false);
					me.findElement(preId).attr('disabled',false);
				}else{
					//disable
					me.findElement(firstId).attr('disabled',true);
					me.findElement(preId).attr('disabled',true);
				}

				var hasNextPage= (info.pages -currentPage) >0;
				if(hasNextPage){
					//enable next and last
					me.findElement(lastId).attr('disabled',false);
					me.findElement(nextId).attr('disabled',false);
				}else{
					//disable
					me.findElement(lastId).attr('disabled',true);
					me.findElement(nextId).attr('disabled',true);
				}

				var $paginationControlContainer=me.findElement(containerId);
				if(info.pages<1){
					//hide the pagination control if total page is less than 0
					$paginationControlContainer.hide();
				}else{
					$paginationControlContainer.show();
				}
					
			},
			setupCustomMessageHandler: function(){
				var me= this;

				me._messageBus.subscribe('onSearch',function(){
					console.log(me._name+'=>on search', arguments);
					var searchBy= arguments[1].searchBy || "";
					var searchTerm= arguments[1].searchTerm || "";
					me.table.columns(searchBy).search(searchTerm).draw();
				});
				
				me._messageBus.subscribe('onTotalRecordsChanged',function(){
					var totalRecords= arguments[1] || 0;
					console.log('onTotalRecordsChanged',totalRecords);
					me.findElement(me.settings.paginationControls.totalRecordsControlId).html("Total Records : "+ totalRecords);
				});
			},
			setupEventsListener: function(){
				var me= this;

				var totalPages= me.getTotalPages();

				me.table.on('draw.dt', function () {
					console.log('on page redraw');

					//recreate dropdown list
					me.createPagingDropdown();

					me._messageBus.publish('onTotalRecordsChanged',me.table.page.info().recordsDisplay);
					me._messageBus.publish('onTotalPageChanged',me.getTotalPages());
					me.enableOrDisablePaginationControls();
				});

				//on page(records per page) length changed event
				me.table.on( 'length.dt', function ( e, settings, len ) {
					console.log( 'New page length: '+len );
					me.renderElements();
				} );
				
				//on page switching event
				me.table.on('page.dt', function () {
					me.enableOrDisablePaginationControls();
				} );

				var firstId=  this.settings.paginationControls.firstPageControlId;
				me.findElement(firstId).on( 'click', function () {
					me.table.page('first').draw('page');
				});

				var lastId=  this.settings.paginationControls.lastPageControlId;
				me.findElement(lastId).on( 'click', function () {
					me.table.page('last').draw('page');
				});

				var preId=  this.settings.paginationControls.prePageControlId;
				me.findElement(preId).on( 'click', function () {
					me.table.page('previous').draw('page');
				});

				var nextId=  this.settings.paginationControls.nextPageControlId;
				me.findElement(nextId).on( 'click', function () {
					me.table.page('next').draw('page');
				});

				//dropdown
				var selectedPageId=  this.settings.paginationControls.selectedPageControlId;
				var $select= me.findElement(selectedPageId);
				$select.on('change', function () {
					var goToPage=  Math.floor($(this).val());
				
					console.log('goto '+ (goToPage+1)+'/'+totalPages);
					if(goToPage>-1 && goToPage<totalPages){
						me.table.page(goToPage).draw('page');
					}
				});
			},
			getTotalPages: function(){
				return Math.floor(this.table.page.info().pages);
			},
			getElementWithinRootContainerByClass: function(key){
				var me= this;
				return document.querySelector('.'+me._domRootClassName+ ' .'+key);
			},
			createPagingDropdown: function(){
				var me=this;
				//create dropdown list
				var selectedPageId=  this.settings.paginationControls.selectedPageControlId;
				var $select= me.findElement(selectedPageId);
				var totalOptions= $select.find('option').length;
				var totalPages= this.getTotalPages();

				if(totalOptions!=totalPages){
					console.log('creating dropdown options:',totalPages);
					$select.empty();
					for(var i=0; i<totalPages; i++){
						var optElement= document.createElement('option');
						optElement.value=i;
						optElement.text=i+1;
						$select.append(optElement);
					}
				}
			},
			renderElements: function() {
				var me =this;
				var totalPages= me.getTotalPages();
				console.log('total records: ',this.table.page.info().recordsTotal);

				me.enableOrDisablePaginationControls();

				//after datatable init, render elements for each section
				var children= $.map(me.settings.sections,function(v,k){
					if(v.children && v.children.length>0){
						return v.children;
					}
				});
				console.log('children: ',children);

				$.map(children,function(v,k){
					var isTable= v.type ? v.type.toLowerCase()==='table' : false;
					if(!isTable){
						var ele=me.getElementWithinRootContainerByClass(v.class);
						var data=me.table.data();
						if(v.render){
							var content=v.render.call(null,ele,me._messageBus,data);
							me.findElement('.'+v.class).html(content);
						}
						if(v.action){
							v.action.call(null,ele,me._messageBus);
						}

					}
					
					var type=v.type || '';
					if(type.toLowerCase()==='pagination-select'){
						//var el=me.getElementWithinRootContainerByClass(v.class);
						me.findElement('.'+v.class).html(me.paginationTemplate);
					}
				});

				me.createPagingDropdown();

				me._messageBus.publish('onTotalRecordsChanged',this.table.page.info().recordsTotal);
				me._messageBus.publish('onTotalPageChanged',me.getTotalPages());	
			},

		} );

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function( options ) {
			
			var instanceName=pluginName+ '_'+ this.selector.trim();
			
			return this.each( function() {
				if ( !$.data( this, "plugin_" + instanceName ) ) {
					console.log('creating plugin instance: ',instanceName);
					$.data( this, "plugin_" +
						instanceName, new Plugin( this, options, instanceName) );
				}
			} );
		};

} )( jQuery, window, document );