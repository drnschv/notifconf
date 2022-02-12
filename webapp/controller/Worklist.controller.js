sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
    "sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, MessageBox) {
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

            // cambio 1

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
            this.setUseBatchModel(false);
            var that = this;
            return new Promise(function (resolve, reject) {
                oModel.update(sPath, oData, {
                    success: function () {
                        that.setUseBatchModel(true);
                        resolve();
                    },
                    error: function (oError) {
                        that.setUseBatchModel(true);
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

        onPressDesactivar: function (oEvent) {
            var oItems = this.byId("tableData").getSelectedItems();
            this.confirmarGrabar(oItems, 'N');

        },

        onPressActivar: function (oEvent) {
            var oItems = this.byId("tableData").getSelectedItems();
            this.confirmarGrabar(oItems, 'S');

        },

        onSelectionChange: function (oEvent) {
            var oTable = this.byId("tableData");
            var iSelectedItems = oTable.getSelectedItems().length;
            if (iSelectedItems > 1) {
                this.byId("btnDesactivarId").setEnabled(true);
                this.byId("btnActivarId").setEnabled(true);
            } else {
                this.byId("btnDesactivarId").setEnabled(false);
                this.byId("btnActivarId").setEnabled(false);
            } 

        },

        onUpdateStarted: function (oEvent) {
            var oTable = this.byId("tableData");
            oTable.getSelectedItems().forEach( item => {
                oTable.setSelectedItem(item, false);
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
		/* save methods                                                */
		/* =========================================================== */
        confirmarGrabar: function (aItems, sActiva) {
            var iLength = aItems.length; 
            var sMessage = "";
            if (sActiva === 'S') {
                var sMessage = this.getResourceBundle().getText("msgActivarTxt", iLength.toString());
                var aActions = ["Continuar y Activarlas", "Cancelar"];
            } else {
                var sMessage = this.getResourceBundle().getText("msgDesactivarTxt", iLength.toString());
                var aActions = ["Continuar y Desactivarlas", "Cancelar"];
            }
            
            var that = this;
            MessageBox.warning(sMessage, {
                actions: aActions,
                onClose: function (sAction) {
                    if (sAction === "Cancelar") {
                        sap.m.MessageToast.show("Accion Cancelada");
                    } else {
                        that.createEntries(aItems, sActiva);  
                    }

                }
            });

        },

        createEntries: function (aDataObject, sActiva) { 
            var aSuccess = [];
            var aError = [];
            var oModel = this.getView().getModel();
            this.setUseBatchModel(false);
            var that = this;
            var runCreate = function (dataIndex) {
                if (aDataObject.length === dataIndex) {
                    sap.m.MessageToast.show("Configuraciones actualizadas: " + aSuccess.length);
                    that.getView().setBusy(false);
                    that.setUseBatchModel(true);
                    that.onSelectionChange();
                    //that.onNavBack();
                    return;
                }

                var sPath = "";
                var oDataObject = {};
                var oNewData = {};
                oDataObject = aDataObject[dataIndex];
                var sPath = oDataObject.getBindingContextPath();
                oNewData.kunnr = oDataObject.getBindingContext().getObject().kunnr;
                oNewData.rol = oDataObject.getBindingContext().getObject().rol;
                oNewData.notifid = oDataObject.getBindingContext().getObject().notifid;
                oNewData.activa = sActiva;

                oModel.update(sPath, oNewData, {
                    success: function (oData) {
                        aSuccess.push(oNewData);
                        runCreate(++dataIndex);
                    },
                    error: function (oError) {
                        aError.push(oNewData);
                        runCreate(++dataIndex);
                    }
                });                    

            }
            this.getView().setBusy(true);
            runCreate(0);         

        },

        setUseBatchModel: function (bUseBatch) {
            this.getView().getModel().setUseBatch(bUseBatch);
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
            this.getRouter().navTo("object");
            
        },
        


        

	});
});