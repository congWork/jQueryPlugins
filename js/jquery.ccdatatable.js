;( function( $, window, document, undefined ) {
       /*
                //How to use? Example:

                var options={
                  pageLength: 25,
                  sections:[
                    {
                        appendTo: '#PaginationContainer', 
                        type: 'pagination-select' //since this is a build-in type, 'render' and 'action' are not needed
                    },
                    {
                        appendTo: '#WorkUnitDt_NoRecordFound',
                        render: function(messageBus,data,settingInfo){
                             return '<div class="noRecordFound">No Records found</div>';
                        },
                        action: function($element,messageBus,settingInfo){
                          //show and hide 'no record' message
                            messageBus.subscribe('onTotalPageChanged',function(e,totalPage){
                                if (totalPage < 1) {
                                    $element.show();
                                } else {
                                    $element.hide();
                                }
                            });
                        }
                    },
                    {
                        appendTo: '#WorkUnitTableSearchToolbarContainer',
                        render: function (messageBus, data, settingInfo) {
                            return $('#WorkUnitTableSearchToolbarTemplate').html();
                        },
                        action: function($element,messageBus,settingInfo){
                            $element.find('input[name="Search"]').on('click',function(){
                                var searchBy= $element.find('#searchWorkUnit').val();
                                var searchTerm = $element.find('#searchWorkUnitBox').val();
                                if (searchTerm && searchBy) {
                                     messageBus.publish('onSearch',{searchBy: parseInt(searchBy, 10),searchTerm: searchTerm});
                                }
                            });

                            //clear search term when search by dropdown on change
                            $element.find('#searchWorkUnit').on('change', function () {
                                  $element.find('#searchWorkUnitBox').val('');
                            });

                            //clear button on click, reset all inputs
                            $element.find('input[name="Clear"]').on('click', function () {
                                  $element.find('#searchWorkUnit').val(1);
                                  $element.find('#searchWorkUnitBox').val('');
                                  messageBus.publish('onClear');
                            });
                        }
                     }
                ],
                ajax: {
                    type: "POST",
                    url: "/ManageRelations.aspx/GetWorkUnitData",
                    dataSrc: 'd',
                    data: {},
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                },
                columns: [ 
                    {
                        "orderable": false,
                        "render": function (data, type, full, meta) {
                            return '<label class="hidden" aria-hidden="false" for="checkbox'+full.WorkUnitSeqNo+'">"Select this checkbox"</label> \
                        <input type="checkbox" class="appraisalSelect" title="Select this checkbox" id="checkbox'+full.WorkUnitSeqNo+'">';
                        }
                    },
                    {"data": "WorkUnitSeqNo"},
                    { "data": "PaAdminName" },
                    {"data": "CommissionerName"},
                     {"data": "TotalEmployees"}
                ],

           };
            $('#WorkUnitTable').CcDataTable('workUnitTable', options, function (dt) {
                window.myDtTable = dt;

               //append html for number of records per page dropdown
                //set default selected value
                //set up on change event listener
                $('#PaginationContainer .totalRecords').append($('#NumOfRecordsPerPageTemplate').html());
                $('#PaginationContainer #paginationRows').val(dt.page.len()).on('change', function () {
                    var newVal = parseInt($(this).val());
                    console.log('numOfRecordsPerPage on changed: ', newVal);
                    dt.page.len(newVal).draw();
                });

                //table checkboxes
                //// Show hide approve all button
	            var appraisalSelectAll = $(this).find('#appraisalSelectAll2');
	            var appraisalSelect = $(this).find('.appraisalSelect');
	            var appraisalAnySelect =  $(this).find('.appraisalSelect , #appraisalSelectAll2');
	            var btnApprove = $('.btnApprove');
	            appraisalSelectAll.click(function () {
		            if (appraisalSelectAll.is(':checked')) {
			            appraisalSelect.prop("checked", true);
		            } else {
			            appraisalSelect.prop("checked", false);
		            }
	            });
	            appraisalAnySelect.click(function(){
		            if (appraisalSelect.is(':checked')) {
			            btnApprove.fadeIn();
		            } else {
			            btnApprove.fadeOut();
		            }
                });

                dt.on('draw.dt', function () {
                    appraisalSelectAll.prop('checked', false);
                    appraisalSelect.prop("checked", false);
                    btnApprove.fadeOut();
                });

            });


              custom events:
                ['onSearch', 'onClear','onTotalRecordsChanged']

                section node:
                appendTo--> must be a dom element id, this indicate where you want to place your html contents in the render property
                type--> the type of node, current build-in types are supported: ['pagination-select']
                render--> (optional) a function that returns your html content to be rendered
                action--> (optional) a function that happens after system renders your html content, system is expecting you to put your "to do stuff"
            */
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
		function Plugin ( element, options, pluginIntanceName,callBack ) {
			var me= this;
			this.element = element;
			this._name = pluginIntanceName;
			
			this.config= {
				paginationSelectContainer: {}
			};

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
			this.paginationTemplate='<div class="totalRecords">Total Records : <span class="bold" data-name="{{totalRecordsControlId}}">0</span></div> \
		<div class="paginationTools" data-name="{{containerId}}"> \
		<button class="fa fa-fast-backward paginationIcon paginationDisabled" data-name="{{firstPageControlId}}" type="button" title="Go to first page disabled"><span class="hidden" aria-hidden="false">"Go to first page disabled"</span></button> \
		<button class="fa fa-step-backward paginationIcon paginationDisabled" data-name="{{prePageControlId}}" type="button" title="Go to previous page disabled"><span class="hidden" aria-hidden="false">"Go to previous page disabled"</span></button> \
		<label class="hidden" aria-hidden="false" for="{{selectedPageControlId}}">"Current Page Number"</label> \
		<select data-name="{{selectedPageControlId}}" id="{{selectedPageControlId}}"></select> \
		  <button class="fa fa-step-forward paginationIcon" data-name="{{nextPageControlId}}" type="button" title="Go to next page"><span class="hidden" aria-hidden="false">"Go to next page"</span></button> \
		  <button class="fa fa-fast-forward paginationIcon" data-name="{{lastPageControlId}}" type="button" title="Go to last page"><span class="hidden" aria-hidden="false">"Go to last page"</span></button> \
		</div>';

			this.settings = $.extend( {}, defaults, options );
			this._defaults = defaults;
		

			//create unique id for each pagination control and apply id to the template
			this.settings.paginationControls=$.extend({},paginationControls);
			$.each(paginationControls,function(k,v){
				var id=me.getUniqueId(v);
				me.paginationTemplate = me.replaceKeyWithValue(me.paginationTemplate,k,id);
				var idWithSyntax= '[data-name="'+id+'"]'; //id.charAt(0)==='#' ? id : '#'+id;
				me.settings.paginationControls[k]=idWithSyntax;
			});
			console.log(this._name+' paginationTemplate: ',me.paginationTemplate);

			//create dom
			me._defaults.dom="";

			me._domRootClassName='wrapper_'+me.getUniqueId('dt');
		
			this.settings.dom=me.getCustomDom();
			console.log("dom: ",this.settings.dom);

			this._messageBus= GetMessageBus();

			//create datatable instance, then init this plugin
			this.table= $(this.element).on( 'init.dt', function (){
				me.init();
				if(callBack && (typeof callBack)==='function'){
					callBack.call(me.element,me.table);
				}
				
			}).DataTable(this.settings);
			
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {
			init: function() {
				this.setupCustomMessageHandler();
				this.renderElements();
				this.enableOrDisablePaginationControls();
				this.setupEventsListener();
			},
			findElement: function(key){
				console.log('finding element at root:',this._domRootClassName,key);
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
				
				var currentDom= me.settings.dom || 't';
				if(currentDom.length>0){
					domArray.push(currentDom);
				}

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

				console.log('enableOrDisablePaginationControls');
				//set current page on the dropdown list
				$(selectId).val(info.page);

				var currentPage= info.page +1;

				console.log('current page# '+ currentPage+'/'+info.pages);
				var hasPrePage= (currentPage-1) >0;
				if(hasPrePage){
					//enable prev and first
					$(firstId)
					.attr('disabled',false)
					.removeClass('paginationDisabled')
					.attr('title','Go to first page')
					.find('span.hidden')
					.html('"Go to first page"');

					$(preId)
					.attr('disabled',false)
					.removeClass('paginationDisabled')
					.attr('title','Go to previous page')
					.find('span.hidden')
					.html('"Go to previous page"');
				}else{
					//disable
					$(firstId)
					.attr('disabled',true)
					.addClass('paginationDisabled')
					.attr('title','Go to first page disabled')
					.find('span.hidden')
					.html('"Go to first page disabled"');

					$(preId)
					.attr('disabled',true)
					.addClass('paginationDisabled')
					.attr('title','Go to previous page disabled')
					.find('span.hidden')
					.html('"Go to previous page disabled"');
				}

				var hasNextPage= (info.pages -currentPage) >0;
				if(hasNextPage){
					//enable next and last
					$(lastId)
					.attr('disabled',false)
					.removeClass('paginationDisabled')
					.attr('title','Go to last page')
					.find('span.hidden')
					.html('"Go to last page"');

					$(nextId)
					.attr('disabled',false)
					.removeClass('paginationDisabled')
					.attr('title','Go to next page')
					.find('span.hidden')
					.html('"Go to next page"');
				}else{
					//disable
					$(lastId)
					.attr('disabled',true)
					.addClass('paginationDisabled')
					.attr('title','Go to last page disabled')
					.find('span.hidden')
					.html('"Go to last page disabled"');

					$(nextId)
					.attr('disabled',true)
					.addClass('paginationDisabled')
					.attr('title','Go to next page disabled')
					.find('span.hidden')
					.html('"Go to next page disabled"');
				}

				var $paginationControlContainer=$(containerId);
				if(info.pages<1){
					//hide the pagination control if total page is less than 0
					$paginationControlContainer.hide();
				}else{
					$paginationControlContainer.show();
				}
					
			},
			setupCustomMessageHandler: function(){
				var me= this;

				//reset data
				me._messageBus.subscribe('onClear',function(){
					console.log(me._name+'=>on Clear', arguments);
					//reset columns data before another search
					me.table.columns().search('').draw();
				});

				me._messageBus.subscribe('onSearch',function(){
					console.log(me._name+'=>on search', arguments);
					var searchBy= arguments[1].searchBy || "";
					var searchTerm= arguments[1].searchTerm || "";
					//reset columns data before another search
					me.table.columns().search('');
					me.table.columns(searchBy).search(searchTerm).draw();
				});
				
				me._messageBus.subscribe('onTotalRecordsChanged',function(){
					var totalRecords= arguments[1] || 0;
					console.log('onTotalRecordsChanged',totalRecords);
					$(me.settings.paginationControls.totalRecordsControlId).html(totalRecords);
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
					//me.renderElements();
				} );
				
				//on page switching event
				me.table.on('page.dt', function () {
					//console.log('on page switch');
					//me.enableOrDisablePaginationControls();
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

				//dropdown
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
			getElementWithinRootContainerByClass: function(key){
				var me= this;
				return document.querySelector('.'+me._domRootClassName+ ' .'+key);
			},
			createPagingDropdown: function(){
				var me=this;
				//create dropdown list
				var selectedPageId=  this.settings.paginationControls.selectedPageControlId;
				var totalPages= me.getTotalPages();

				$.each(me.config.paginationSelectContainer,function(k,v){
				
					var $select= $(k).find(selectedPageId);
					var totalOptions= $select.find('option').length;
				
	
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
				});
				
			},
			renderElements: function() {
				var me =this;
				var totalPages= me.getTotalPages();
				console.log('total records: ',this.table.page.info().recordsTotal);

				//after datatable init, render elements for each section
				var data=me.table.data();
				$.each(me.settings.sections,function(k,v){
					var appendToId= v.appendTo.charAt(0)==='#' ? v.appendTo.replace('#','') : v.appendTo;
					var appendToElement=document.getElementById(appendToId);
					if(!appendToElement){
						console.log('appendTo('+appendToId+') for type('+v.type+') must be a valid id');
						return;
					}
					var $appendTo= $(appendToElement);
					var type=v.type || '';
					var $currentElement=null;
					var settingInfo={
						tableRootElement: document.querySelector('.'+me._domRootClassName)
					};
				

					if(type.toLowerCase()==='pagination-select'){
						var key='#'+appendToId;
						var hasKey=me.config.paginationSelectContainer[key]!== undefined;
						if(!hasKey){
							me.config.paginationSelectContainer[key]=1;
							$appendTo.append(me.paginationTemplate);
						}
						return;
					}

					if(v.render){
						//get the html content from the render method
						//then place the html content to the container
						var content=v.render.call(null,me._messageBus,data, settingInfo);
						$currentElement=$(content);
						$currentElement.appendTo($appendTo);
					}

					if(v.action){
						//after rending, do action
						v.action.call(null,$currentElement,me._messageBus, settingInfo);
					}
				});

				me.createPagingDropdown();

				me._messageBus.publish('onTotalRecordsChanged',this.table.page.info().recordsTotal);
				me._messageBus.publish('onTotalPageChanged',me.getTotalPages());	
			},

		} );

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[pluginName] = function(pluginUniqueName,options,callBack) {
			var instanceName=pluginName+ '_'+ pluginUniqueName;
			
			return this.each( function() {
				if ( !$.data( this, "plugin_" + instanceName ) ) {
					console.log('creating plugin instance: ',instanceName);
					$.data( this, "plugin_" +
						instanceName, new Plugin( this, options, instanceName,callBack) );
				}
			} );
		};

} )( jQuery, window, document );