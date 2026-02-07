const { parseMbrParameters } = require('./parser');

/**
 * Build a default params object from a Mobirise component's <mbr-parameters>
 * @param {string} customHTML - the Mobirise _customHTML string
 * @returns {object} params - key/value map of parameter defaults
 */
function extractDefaultParams(customHTML) {
    const { controls } = parseMbrParameters(customHTML);
    const params = {};

    controls.forEach(ctrl => {
        if (ctrl.kind === 'checkbox') {
            params[ctrl.name] = ctrl.attrs.checked || false;
        }

        else if (ctrl.kind === 'range') {
            const val = ctrl.value || ctrl.attrs.min || 0;
            params[ctrl.name] = Number(val);
        }

        else if (ctrl.kind === 'color' || ctrl.kind === 'image' || ctrl.kind === 'video') {
            if (ctrl.kind === 'color') {
                params[ctrl.name] = ctrl.value;
            } else {
                params[ctrl.name] = ctrl.value || '';
            }

        }

        else if (ctrl.kind === 'background') {
            // Find selected option (or default to first)
            let selected = ctrl.options.find(o => o.attrs.selected) || ctrl.options[0];
            params[ctrl.name] = {
                type: selected.kind,
                value: selected.value,
                parallax: ctrl.attrs.parallax || false
            };
        }

        else if (ctrl.kind === 'select') {
            // Default to the first option or the explicitly selected one
            const selected = ctrl.options.find(o => o.selected) || ctrl.options[0];
            params[ctrl.name] = selected ? selected.value : null;
        }
    });

    return params;
}

module.exports = { extractDefaultParams };