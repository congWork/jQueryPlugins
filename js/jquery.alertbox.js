;( function( $, window, document, undefined ) {
	"use strict";
		var pluginName = "alertBox";
		
		function GetUniqueId(){
				var randNum= Math.floor((Math.random() * 1000) + 1);
				return 'id_'+new Date().valueOf()+'_'+randNum;
		}

		// The actual plugin constructor
		function Plugin ( element, options, pluginIntanceName,callBack ) {
			var me= this;
			this.element = element;
			this._name = pluginIntanceName;
			this._isDismissedKey= 'isDismissedKey';

			this.pluginStyle=`<style>
					.alertBox{
						padding: 8px 35px 8px 14px;
						margin-bottom: 20px;
						text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
						background-color: #fcf8e3;
						border: 1px solid #fbeed5;
						-webkit-border-radius: 4px;
						-moz-border-radius: 4px;
						border-radius: 4px;
						display: none;
					}
					.alertBox h4{
						clear: both;
						margin:0;
						padding: 0;
					}
					.alertBox, .alertBox h4{
						color: #c09853;
					}
					.alertBox-close {
						float: right;
						font-size: 20px;
						font-weight: bold;
						line-height: 20px;
						color: #000000;
						text-shadow: 0 1px 0 #ffffff;
						opacity: 0.2;
						filter: alpha(opacity = 20);
					}
					button.alertBox-close{
						padding: 0;
						cursor: pointer;
						background: transparent;
						border: 0;
						-webkit-appearance: none;
					}
					.alertBox .alertBox-close {
						position: relative;
						top: -2px;
						right: -21px;
						line-height: 20px;
					}
					#maintenanceTitle{
						padding-left: 5px;
					}
					.h4{
						font-size: 1.25rem;
						font-weight: 500;
						line-height: 1.2;
					}
					.maintenanceIcon{
						font-style: normal;
					}
			</style>`;

			var defaults = {
				url: null,
				title: null,
				message: null,
				startDatetime: null,
				endDatetime: null,
				isShowOnceForEntireBrowserSession: true
			};
			
			this.alertTemplate=`<div class="alertBox alert-block" id="{{pluginInstanceName}}">
							<button type="button" class="alertBox-close">&times;</button>
							<div class="h4"><i class="maintenanceIcon" aria-hidden="true">&#9888</i><span id="maintenanceTitle">{{title}}</span></div>
							<p id="maintenanceMsg">
							{{message}}
							</p>
							</div>`;

			this.settings = $.extend( {}, defaults, options );
			this.settings.pluginInstanceName= pluginIntanceName;

			this._defaults = defaults;

			me.init();

			if(callBack && (typeof callBack)==='function'){
				callBack.call(me.element,me);
			}
		}

		// Avoid Plugin.prototype conflicts
		$.extend( Plugin.prototype, {
			init: function() {
				var me = this;

				$.each(me.settings, function(k,v){
					me.alertTemplate= me.replaceKeyWithValue(me.alertTemplate, k,v);
				});

				me.initPluginStyle();

				$(this.element).append(me.alertTemplate);

				$(this.element).on('click','.alertBox-close', function(){
					$('#'+me.settings.pluginInstanceName).fadeOut();
					if(me.settings.isShowOnceForEntireBrowserSession){
						sessionStorage.setItem(me._isDismissedKey, true);
					}
				});

				var isDismissClicked= sessionStorage.getItem(me._isDismissedKey);

				if(me.settings.url && !isDismissClicked){
					$.ajax({
						url: me.settings.url, 
						type: 'get', 
						cache: false,
						dataType: 'json', 
						contentType: "application/json;charset=utf-8",
						success: function(data) {
							me.setMaintenanceMessage(data.title,data.message);
							me.showAlert(new Date(data.startDatetime), new Date(data.endDatetime));
						},
						error: function(xhr, status, error) {
						 	console.log(error);
						}
					  });
				}else{

					me.showAlert(new Date(me.settings.startDatetime), new Date(me.settings.endDatetime));
				}
				
			},
			initPluginStyle: function(){
				var me= this;
				$('head').append(me.pluginStyle);
			},
			setMaintenanceMessage: function(title,msg){
				var me= this;
				var $msgTitleDiv= $(this.element).find('#maintenanceTitle');
				$msgTitleDiv.html(title);
				
				var $msgDiv= $(this.element).find('#maintenanceMsg');
				$msgDiv.html(msg);
			},
			replaceKeyWithValue: function(inputStringTemplate,key,value){
				var regex = new RegExp("{{"+key+"}}", "gi");
				return inputStringTemplate.replace(regex, value);
			},
			showAlert(startDatetime, endDatetime){
				var me= this;
				var $alertBox=$(this.element).find('#'+me.settings.pluginInstanceName);

				var isDismissClicked= sessionStorage.getItem(me._isDismissedKey);

				if(me.settings.isShowOnceForEntireBrowserSession && isDismissClicked){
					return;
				}
				var nowDt= new Date();
				if(nowDt>= startDatetime && nowDt<= endDatetime){
					$alertBox.fadeIn();
				}else{
					$alertBox.fadeOut();
				}
			}

		} );

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[pluginName] = function(options,callBack) {
			var instanceName=pluginName+ '_'+ GetUniqueId();
			
			return this.each( function() {
				if ( !$.data( this, "plugin_" + instanceName ) ) {
					$.data( this, "plugin_" +
						instanceName, new Plugin( this, options, instanceName,callBack) );
				}
			} );
		};

} )( jQuery, window, document );