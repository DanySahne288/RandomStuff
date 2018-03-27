// ==UserScript==
// @name         Jira Label Customizations
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Tweaks to Jira labels to make them more visible
// @author       Daniela Kirsch (parts by Steven Scott)
// @match        https://*.atlassian.net/*
// @grant        none
// ==/UserScript==

console.mystuff = function(msg, heading) {
    if(typeof heading === 'undefined')
    {
        console.log(msg);
    }
    else
    {
        console.log('%c ' + msg, 'background: #144daa; color: #fff');
    }
};
(function() {
    'use strict';

var GetProjectName = function (sLabel) {
    var p = sLabel.indexOf('_');
    return jQuery.trim(sLabel.substr(0, p));
};
var GetRC = function (sLabel) {
    var p = sLabel.lastIndexOf('_');
    return jQuery.trim(sLabel.substr(p + 3));
};
    var Config = {
        FormatLabels: true
    };

    // Allow easy customization by having these be "Modules", enabled via the "Config" variable at the top of the script
    var Modules = {
        // Format labels
        FormatLabels: function ()
        {
            var rcLabelRegex = /([\w]+)([0-9]+)(_rc)([0-9]+)/gi;
            var rcLabelName = 'rc-label';
            // for labels in task details
            jQuery('.lozenge span').filter(':not(.jiracust_formatlabels)').each(function () {
                var labelText = jQuery(this).text();
                var m = labelText.match(rcLabelRegex);
                console.mystuff('RC Label Regex', true);
                console.mystuff(m);
                if(m !== null)
                {
                    var projectClass = "rc-label-" + GetProjectName(m[0]);
                    var rcClass = "rc-label-" + GetRC(m[0]);
                    console.mystuff(projectClass, true);
                    console.mystuff(rcClass, true);
                    jQuery(this).addClass(rcLabelName).addClass(projectClass).addClass(rcClass);
                }
                jQuery(this).addClass('jiracust_formatlabels');
            });
            jQuery('.ghx-extra-field-content').filter(':not(.jiracust_formatlabels)').each(function () {
                var content = jQuery(this).text();
                var newLabelContent = '';
                if (content !== "None")
                {
                    var contentArray = content.split(',');
                    var labelClass = '';
                    for (var i in contentArray) {
                        labelClass = 'default';
                        var m = contentArray[i].match(rcLabelRegex);
                        if(m !== null)
                        {
                            var projectClass = "rc-label-" + GetProjectName(m[0]);
                            var rcClass = "rc-label-" + GetRC(m[0]);
                            labelClass = rcLabelName + ' ' + projectClass + ' ' + rcClass;
                        }
                        newLabelContent += '<span class="' + labelClass + '">' + jQuery.trim(contentArray[i]) + '</span>';
                    }
                }
                jQuery(this).addClass('jiracust_formatlabels').html(newLabelContent);
            });
        }
    };

    // When the page changes, run our functions
    var OnPageChanged = function()
    {
        console.log('JiraCustomizations::OnPageChanged: ' + window.location.href);
        mutationActive = true;

        for (var Module in Modules)
        {
            if (!Modules.hasOwnProperty(Module)) continue;
            if (!Config.hasOwnProperty(Module)) continue;

            if (Config[Module])
            {
                Modules[Module]();
            }
        }

        mutationActive = false;
    };

     /*****************************
      Use a MutationObserver to watch for page changes.
      *****************************/
    // First try to get a Jira body tag
    var mutationTarget = document.getElementById('jira');

    // If we didn't find a Jira body, check if we're in an iFrame within Jira
    if (mutationTarget == null)
    {
        if (window.parent.document.getElementById('jira') != null)
        {
            mutationTarget = document.body;
        }
    }

    if (mutationTarget != null)
    {
        var mutationOptions = {
            childList: true,
            subtree: true
        };

        // Use a timer so we only trigger our changes if there have been no writes for 50ms
        var mutationTimer = 0;
        var mutationActive = false;
        var mutationCallback = function(mutationsList) {
            if (mutationTimer) {
                window.clearTimeout(mutationTimer);
            }

            if (!mutationActive)
            {
                mutationTimer = window.setTimeout(function() {
                    OnPageChanged();
                }, 50);
            }
        };

        var mutationObserver = new MutationObserver(mutationCallback);
        mutationObserver.observe(mutationTarget, mutationOptions);

        // Call OnPageChanged() right away, so we catch any "static" pages (Dashboard activity stream, for example)
        OnPageChanged();
    }
})();