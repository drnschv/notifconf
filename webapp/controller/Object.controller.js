sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History",
    "sap/ui/core/Fragment",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
	"../model/formatter"
], function (BaseController, JSONModel, History, Fragment, Token, Filter, FilterOperator, MessageBox, formatter) {
	"use strict";

	return BaseController.extend("profertil.notifconf.controller.Object", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit : function () {          
            var oViewModel = new JSONModel({});
            this.setModel(oViewModel, "objectView");
            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            
        },

        createFilterModel: function () {
            var oModel = new JSONModel({
                aBrsch: [],
                aRol: [],
                aKunnr: [],
                notifid: ""
            });
            this.getView().setModel(oModel, "filterModel");
        },
        
        onSelectionFinishKunnr: function () {
            var oMultiInput = this.byId("kunnrIDM");
            var oTokens = oMultiInput.getTokens();
            this.saveFilter(oTokens, "kunnr", "/aKunnr", "filterModel");

        },
        
        onSelectionFinishRol: function (oEvent) {
            var selectedItems = oEvent.getParameter("selectedItems");
            this.saveFilter(selectedItems, "rol", "/aRol", "filterModel");

        },

        onSelectionFinishBrsch: function (oEvent) {
            var selectedItems = oEvent.getParameter("selectedItems");
            this.saveFilter(selectedItems, "brsch", "/aBrsch", "filterModel");

        },

        onChangeNotifid: function (oEvent) {
            var selectedItem = oEvent.getSource().getSelectedItem();
            var selectedItems = [];
            if (selectedItem) {
                selectedItems.push(selectedItem);
            }
            this.saveFilter(selectedItems, "notifid", "/notifid", "filterModel");

        },

        saveFilter: function (aSelectedItems, sPath, sProperty, sModelName) {               
            var aFilter = [];
            var oModel = this.getView().getModel(sModelName);
            for (var i = 0; i < aSelectedItems.length; i++) {
                var sKey = aSelectedItems[i].getKey();
                aFilter.push( new Filter({
                    path: sPath,
                    operator: FilterOperator.EQ,
                    value1: sKey
                }));

            }
            oModel.setProperty(sProperty, aFilter);

        },

        validarDatos: function () {
            var oModel = this.getView().getModel("filterModel");

            var notifid = oModel.getProperty("/notifid");
            if (!this.validateField(notifid, "notifidID")) {
                return false;
            }

            var rol = oModel.getProperty("/aRol");
            if (!this.validateField(rol, "rolID")) {
                return false;
            }
            
            return  true;

        },

        validateField: function (sFieldValue, sFieldId) {
            var bResult = true;
            var oField = this.byId(sFieldId);
            if (!sFieldValue || !sFieldValue.length) {
                oField.setValueState("Error");
                oField.setValueStateText("Es un campo obligatorio");
                bResult = false;
            } else {
                oField.setValueState("None");
                oField.setValueStateText("");
                bResult = true;
            }
            return bResult;

        },

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
        onPressGrabar: function () {
            this.onSelectionFinishKunnr();

            if (!this.validarDatos()) {
                sap.m.MessageToast.show("Complete los datos Obligatorios");
                return;
            };
            var aFilters = [];
            aFilters = this.armarFiltros();
            var that = this;
            this.leerConfiguraciones(aFilters).then(function (oData) {
                if (oData.results.length) {
                    that.confirmarGrabar(oData.results);
                } else {
                    sap.m.MessageToast.show("Valide la configuracion ingresada");
                }
                
            });
            
        },

        onPressCancelar: function () {
            this.onNavBack();
        },

		/**
		 * Event handler  for navigating back.
		 * It there is a history entry we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the worklist route.
		 * @public
		 */
		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
            }
            
		},

        /* =========================================================== */
		/* save methods                                                */
        /* =========================================================== */
        createEntries: function (aDataObject) { 
            var aSuccess = [];
            var aError = [];
            var oModel = this.getView().getModel();
            oModel.setUseBatch(false);
            var sPath = "/ConfiguracionSet";
            var bActiva = this.byId("activaID").getState();
            var sActiva = bActiva ? "S" : "N";
            var that = this;
            var runCreate = function (dataIndex) {
                if (aDataObject.length === dataIndex) {
                    sap.m.MessageToast.show("Configuraciones creadas: " + aSuccess.length);
                    //console.warn("OK: " + aSuccess.length + ", Errores: " + aError.length );
                    that.onNavBack();
                    that.getView().setBusy(false);
                    return;
                }

                var oDataObject = {};
                oDataObject = aDataObject[dataIndex];
                var oNewData = {};
                oNewData.kunnr = oDataObject.kunnr;
                oNewData.rol = oDataObject.rol;
                oNewData.notifid = oDataObject.notifid;
                oNewData.brsch = oDataObject.brsch;
                oNewData.activa = sActiva;

                oModel.create(sPath, oNewData, {
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
        
        confirmarGrabar: function (aConfiguraciones) {
            var iLength = aConfiguraciones.length; 
            var sMessage = this.getResourceBundle().getText("msgConfirmTxt", iLength.toString());
            var that = this;
            MessageBox.warning(sMessage, {
                actions: ["Generar Configuraciones", "Cancelar"],
                onClose: function (sAction) {
                    if (sAction === "Cancelar") {
                        sap.m.MessageToast.show("Accion Cancelada");
                    } else {
                        that.createEntries(aConfiguraciones);  
                    }

                }
            });

        },

        armarFiltros: function () {
            this.onSelectionFinishKunnr();

            var aFilters = [];
            var aBrsch = [];
            var aRol = [];
            var aKunnr = [];
            var aNotifid = [];
            var oModel = this.getView().getModel("filterModel");

            aBrsch = oModel.getProperty("/aBrsch");
            aRol = oModel.getProperty("/aRol");
            aKunnr = oModel.getProperty("/aKunnr");
            aNotifid = oModel.getProperty("/notifid");
            if (aBrsch.length) {
                aFilters.push( new Filter({filters: aBrsch}) );
            }

            if (aRol.length) {
                aFilters.push( new Filter({filters: aRol}) );
            }

            if (aKunnr.length) {
                aFilters.push( new Filter({filters: aKunnr}) );
            }

            if (aNotifid.length) {
                aFilters.push( new Filter({filters: aNotifid}) );
            }
            return aFilters;

        },

        leerConfiguraciones: function (aFilters) {
                var oModel = this.getView().getModel();
                return new Promise(function (resolve, reject) {
                    var sPath = "/VH_ConfiguracionSet";
                    oModel.read(sPath, {
                        success: function (oData, oResponse) {
                            resolve(oData);
                        },
                        error: function (oError) {
                            reject(oError);
                        }, 
                        filters: aFilters
                    });

                });

            },

		/* =========================================================== */
		/* internal methods                                            */
		/* =========================================================== */

		_onObjectMatched : function (oEvent) {    
            this.byId("brschID").setSelectedKeys([]);
            this.byId("rolID").setSelectedKeys([]);
            this.byId("kunnrIDM").setTokens([]);
            this.byId("notifidID").setSelectedKey("");
            this.createFilterModel();
        
        },

        // configuracion VH open
        onPressVerConfiguracion: function (oEvent) {
            this.onSelectionFinishKunnr(); // update filtro cliente
            if (!this.validarDatos()) {
                sap.m.MessageToast.show("Complete los datos Obligatorios");
                return;
            };

            var oView = this.getView();
            if (!this._pVHConfiguracion) {
                this._pVHConfiguracion = Fragment.load({
                    id: oView.getId(),
                    name: "profertil.notifconf.view.VHConfiguracion",
                    controller: this
                }).then(function (oValueHelpDialog) {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }

            this._pVHConfiguracion.then(function (oValueHelpDialog) {
                var aFilters = [];
                var oModel = this.getView().getModel("filterModel");
                var aBrsch = oModel.getProperty("/aBrsch");
                var aRol = oModel.getProperty("/aRol");
                var aKunnr = oModel.getProperty("/aKunnr");
                var aNotifid = oModel.getProperty("/notifid");

                if (aBrsch.length) {
                    aFilters.push( new Filter({filters: aBrsch}) );
                }

                if (aRol.length) {
                    aFilters.push( new Filter({filters: aRol}) );
                }

                if (aKunnr.length) {
                    aFilters.push( new Filter({filters: aKunnr}) );
                }

                if (aNotifid.length) {
                    aFilters.push( new Filter({filters: aNotifid}) );
                }

                oValueHelpDialog.getBinding("items").filter(aFilters);
                oValueHelpDialog.open();

            }.bind(this));

        }, 


        // kunnr VH search
        _handleVHConfiguracionSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            
            var oFilter = new Filter(
                "name1",
                FilterOperator.Contains,
                sValue
            );                             
            oEvent.getSource().getBinding("items").filter([oFilter]);

        }, 

        // configuracion VH Close
        _handleVHConfiguracionClose: function (oEvent) {
            
        },

        // kunnr VH open
        handleVHKunnr: function (oEvent) {
            var oView = this.getView();

            if (!this._pVHKunnr) {
                this._pVHKunnr = Fragment.load({
                    id: oView.getId(),
                    name: "profertil.notifconf.view.VHKunnr",
                    controller: this
                }).then(function (oValueHelpDialog) {
                    oView.addDependent(oValueHelpDialog);
                    return oValueHelpDialog;
                });
            }

            this._pVHKunnr.then(function (oVHDialog) {
                var aFilters = [];
                var aBrsch = [];
                var aRol = [];
                var oModel = this.getView().getModel("filterModel");
                aBrsch = oModel.getProperty("/aBrsch");
                aRol = oModel.getProperty("/aRol");

                if (aBrsch.length) {
                    aFilters.push( new Filter({filters: aBrsch}) );
                }

                if (aRol.length) {
                    aFilters.push( new Filter({filters: aRol}) );
                }

                oVHDialog.getBinding("items").filter(aFilters);
                oVHDialog.open();

            }.bind(this));

        }, 


        // kunnr VH search
        _handleVHKunnrSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            
            var oFilter = new Filter(
                "name1l",
                FilterOperator.Contains,
                sValue
            );                             
            oEvent.getSource().getBinding("items").filter([oFilter]);

        }, 

        // kunnr VH Close
        _handleVHKunnrClose: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var oMultiInput = this.byId("kunnrIDM");
            var sText = [];
            if (aSelectedItems && aSelectedItems.length > 0) {
                aSelectedItems.forEach(function (oItem) {
                    sText = oItem.getTitle().split("-");
                    oMultiInput.addToken(new Token({
                        text: sText[0],
                        key: oItem.getDescription()
                    }));

                });
                
            }
            
            if (oMultiInput.getTokens().length) {
                oMultiInput.setValueState("None");
                oMultiInput.setValueStateText("");
            }

        },  
        

	});

});