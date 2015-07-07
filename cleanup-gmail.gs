// Disclaimer: Shamelessly copied and modified the multipleLabels() function at
// https://www.johneday.com/422/time-based-gmail-filters-with-google-apps-script
// jemshad - 20150707

// ==============================    HOW TO USE    ==============================
// Go to https://script.google.com, create a script for a Blank Project,
// and paste the entire code into the editor
// After saving, click on "Resources" to create a trigger to execute every day/hour
// depending on your needs
// ==============================================================================

function cleanupMultipleLabels() {
  // define the labels for auto cleanup below
  var myLabels = {
      '"Nagios/adserve"'       : "10d",
      '"Nagios/Down/adserve"'  : "10d",
      '"Lists/Pilot-Stats"'    : "5d",
      '"Nagios"'               : "10d",
      '"Pagerduty/primary"'    : "7d",
      '"Pagerduty/secondary"'  : "7d",
  };
  
  // ============================================
  // No need to modify anything below, mostly :-)
  // ============================================
  
  // Record the start time
  var startTime = new Date().getTime();
  var maxRunTime = 300000;  // 300 seconds. Current script execution limit seem to be 6 minutes as per 
                            // https://developers.google.com/apps-script/guides/services/quotas
  
  var batchSize = 100;      // Process up to 100 threads at once
  var searchSize = 300;     // Make search result return 300 results at once
                            // (preferrably, multiples of $batchSize)
  for(aLabel in myLabels)
  {
    while (true) {
      // loop over $searchSize number of threads each time till it returns empty list
      var threads = GmailApp.search('label:'+aLabel+' older_than:'+myLabels[aLabel],0,searchSize);
      if (threads.length == 0) {
        Logger.log("Nothing to do for label: " +aLabel+ "...");
        break;
      }
      Logger.log('Label: ' + aLabel + ' matched ' +threads.length+ ' threads');
      for (j = 0; j < threads.length; j+=batchSize) {
        var retryCount = 0;
        var success = false;
        var curTime = new Date().getTime();
        var timeElapsed = curTime - startTime;
        while (!success & retryCount++ <= 5) {
          if (timeElapsed >= maxRunTime) {
            Logger.log("Stopping execution after running for " +timeElapsed/1000+ " seconds");
            return;
          }
          try {
            GmailApp.moveThreadsToTrash(threads.slice(j, j+batchSize));
            success = true;
            Logger.log("Count " + j + " Success for label: " + aLabel + " in try: " +retryCount);
          } catch (ex) {
            Logger.log("Error while working on label: " +aLabel+ " in try: " +retryCount+ " : "+ex);
            continue;
          }
          Utilities.sleep(1000)
        }
      }
    }
  }  
}
