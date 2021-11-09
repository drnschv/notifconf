sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("profertil.notifconf.controller.Worklist", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {
			var oViewModel;
			oViewModel = new JSONModel({
				worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
			});
			this.setModel(oViewModel, "worklistView");

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when a table item gets pressed
		 * @param {sap.ui.base.Event} oEvent the table selectionChange event
		 * @public
		 */
		onPress : function (oEvent) {
			this._showObject(oEvent.getSource());
        },
        

        onPressAdd: function (oEvent) {
            //sap.m.MessageToast.show("Agregar");
            this._showObject(null);
        },

        onChangeActiva: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext();
            var state = oEvent.getParameter("state");
            var sPath = oContext.getPath();
            var oData = {};
            oData.kunnr = oContext.getProperty("kunnr");
            oData.rol = oContext.getProperty("rol");
            oData.notifid = oContext.getProperty("notifid");
            oData.activa = ( state ? "S" : "N" ); 
            
            this.getView().setBusy(true);
            var that = this;
            this.updateConfiguracion(sPath, oData)
                .then(function () {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Configuracion Actualizada");
                })
                .catch(function () {
                    that.getView().setBusy(false);
                    sap.m.MessageToast.show("Error al actualizar la configuracion. Intente mas tarde"); 
                });

        },

        updateConfiguracion: function (sPath, oData) {
            var oModel = this.getView().getModel();
            oModel.setUseBatch(false);
            return new Promise(function (resolve, reject) {
                oModel.update(sPath, oData, {
                    success: function () {
                        oModel.setUseBatch(true);
                        resolve();
                    },
                    error: function (oError) {
                        oModel.setUseBatch(true);
                        reject();
                    }
                });
            });

        },

        crearConfiguracion: function (sPath, oData) {
            var oModel = this.getView().getModel();
            oModel.setUseBatch(false);
            return new Promise(function (resolve,reject) {
                oModel.create(sPath, oData, {
                    success: function () {
                        oModel.setUseBatch(true);
                        resolve();
                    },
                    error: function () {
                        oModel.setUseBatch(true);
                        reject();
                    }
                });
            });
            
        },

		/**
		 * Event handler for navigating back.
		 * We navigate back in the browser history
		 * @public
		 */
		onNavBack : function() {
			history.go(-1);
		},

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		/**
		 * Shows the selected item on the object page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showObject : function (oItem) {
			//this.getRouter().navTo("object", {
            //    kunnr: oItem.getBindingContext().getProperty("kunnr"),
            //    rol: oItem.getBindingContext().getProperty("rol"),
            //    notifid: oItem.getBindingContext().getProperty("notifid"),
            //});

            this.getRouter().navTo("object");
            
        },
        


        /* =========================================================== */
		/* OLD event handlers                                          */
		/* =========================================================== */

        /**
		 * Triggered by the table's 'updateFinished' event: after new table
		 * data is available, this handler method updates the table counter.
		 * This should only happen if the update was successful, which is
		 * why this handler is attached to 'updateFinished' and not to the
		 * table's list binding's 'dataReceived' method.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */
		onUpdateFinished : function (oEvent) {
			// update the worklist's object counter after the table update
			var sTitle,
				oTable = oEvent.getSource(),
				iTotalItems = oEvent.getParameter("total");
			// only update the counter if the length is final and
			// the table is not empty
			if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
			} else {
				sTitle = this.getResourceBundle().getText("worklistTableTitle");
			}
			this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
		},


        onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("kunnr", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

        /**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh : function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
		 * @private
		 */
		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
});