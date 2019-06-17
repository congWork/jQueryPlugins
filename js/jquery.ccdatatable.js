// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;( function( $, window, document, undefined ) {

	"use strict";

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variables rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pCtrlContainerId='#PaginationControlsContainer';
		var pluginName = "CcDataTable",
			defaults = {
				"dom": '<"#cc_topDiv.row"<"half"<"itemHeader">><"half"f>>r<"formTemplate1"<"panelMainTemplate"t>><"noRecordFound"><"#cc_bottomDiv"<"'+pCtrlContainerId+'">i>',
				pagCtrlContainerId: pCtrlContainerId
			};

		// The actual plugin constructor
		function Plugin ( element, options ) {
			var me= this;
			this.element = element;
	
			// jQuery has an extend method which merges the contents of two or
			// more objects, storing the result in the first object. The first object
			// is generally empty as we don't want to alter the default options for
			// future instances of the plugin
			this.settings = $.extend( {}, defaults, options );
			this._defaults = defaults;
			this._name = pluginName;

			var pControls=this.settings.paginationControls;
			$.each(pControls,function(k,v){
				pControls[k]= v.charAt(0)==='#' ? v : '#'+v;
			});
	
			this.table= $(this.element).on( 'init.dt', function (){
				me.init();
			}).DataTable(this.settings);

		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {
			init: function() {

				// Place initialization logic here
				// You already have access to the DOM element and
				// the options via the instance, e.g. this.element
				// and this.settings
				// you can add more functions like the one below and
				// call them like the example below
				this.initPaginationControls();
				this.setupEventsListener();
				
			},
			enableOrDisablePaginationControls: function(){
				var me= this;
				
				var selectId=  this.settings.paginationControls.selectedPageControlId;
				var firstId=  this.settings.paginationControls.firstPageControlId;
				var preId=  this.settings.paginationControls.prePageControlId;
				var lastId=  this.settings.paginationControls.lastPageControlId;
				var nextId=  this.settings.paginationControls.nextPageControlId;
				var info = me.table.page.info();
				console.log('page info: ', info);
				//set current page on the dropdown list
				$(selectId).val(info.page);

				var currentPage= info.page +1;

				console.log('current page# '+ currentPage+'/'+info.pages);
				var hasPrePage= (currentPage-1) >0;
				if(hasPrePage){
					//enable prev and first
					$(firstId).attr('disabled',false);
					$(preId).attr('disabled',false);
				}else{
					//disable
					$(firstId).attr('disabled',true);
					$(preId).attr('disabled',true);
				}

				var hasNextPage= (info.pages -currentPage) >0;
				if(hasNextPage){
					//enable next and last
					$(lastId).attr('disabled',false);
					$(nextId).attr('disabled',false);
				}else{
					//disable
					$(lastId).attr('disabled',true);
					$(nextId).attr('disabled',true);
				}
					
			},
			setupEventsListener: function(){
				var me= this;
				var totalPages= me.getTotalPages();

				//on page(records per page) length changed event
				me.table.on( 'length.dt', function ( e, settings, len ) {
					console.log( 'New page length: '+len );
					me.initPaginationControls();
				} );
				
				//on page switching event
				me.table.on('page.dt', function () {
					me.enableOrDisablePaginationControls();
				} );

				var firstId=  this.settings.paginationControls.firstPageControlId;
				$(firstId).on( 'click', function () {
					me.table.page('first').draw('page');
				});

				var lastId=  this.settings.paginationControls.lastPageControlId;
				$(lastId).on( 'click', function () {
					me.table.page('last').draw('page');
				});

				var preId=  this.settings.paginationControls.prePageControlId;
				$(preId).on( 'click', function () {
					me.table.page('previous').draw('page');
				});

				var nextId=  this.settings.paginationControls.nextPageControlId;
				$(nextId).on( 'click', function () {
					me.table.page('next').draw('page');
				});

				var selectedPageId=  this.settings.paginationControls.selectedPageControlId;
				var $select= $(selectedPageId);
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
			initPaginationControls: function() {
				var me =this;
				var totalPages= me.getTotalPages();

				me.enableOrDisablePaginationControls();

				//set up pagination controls toolbar
				if(this.settings.paginationHtmlTemplate){
					$(me._defaults.pagCtrlContainerId).html(this.settings.paginationHtmlTemplate);
					//create dropdown list
					var selectedPageId=  this.settings.paginationControls.selectedPageControlId;
					var $select= $(selectedPageId);

					$select.empty();
					for(var i=0; i<totalPages; i++){
						var optElement= document.createElement('option');
						optElement.value=i;
						optElement.text=i+1;
						$select.append(optElement);
					}
				}
			},

		} );

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function( options ) {
			return this.each( function() {
				if ( !$.data( this, "plugin_" + pluginName ) ) {
					$.data( this, "plugin_" +
						pluginName, new Plugin( this, options ) );
				}
			} );
		};

} )( jQuery, window, document );