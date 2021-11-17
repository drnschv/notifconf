sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit : function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
        },
        
        formatActiva: function (sValue) {
            if (sValue === "S") {
                return true;
            }
            return false;
        },

        formatLeadingZeros: function (sValue) {
            for (var x=0; x < sValue.length && sValue.substr(x,1) === "0"; x++);
            return sValue.slice(x,10);

        }

	};

});