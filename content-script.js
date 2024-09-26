chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "download start") {
    sendResponse("received download start");

    try {
      downloadTests(request.taskName, request.testFormat);
    } catch (e) {
      sendResponse(e);
    }
  }
});

function getTestLinks() {
  let testSections = document.querySelectorAll('h4[id^="test"]');  // Select each test section by its ID (e.g., test1, test2)
  let tests = [];

  testSections.forEach((testSection, i) => {
    // Each section starts with a test ID, followed by tables for input, correct output, and user output
    let inputLink = testSection.nextElementSibling.querySelector('a.view').href;
    let outputLink = testSection.nextElementSibling.nextElementSibling.querySelector('a.view').href;

    tests.push({
      inputRef: inputLink,
      outputRef: outputLink,
    });
  });

  return tests;
}

function getTaskId() {
  let link = document.querySelectorAll('a[class="current"]')[0].href;
  return link.split("/").pop();
}

function urlToPromise(url) {
  return new Promise((resolve, reject) => {
    JSZipUtils.getBinaryContent(url, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function downloadTests(taskName, testFormat) {
  const zip = new JSZip();
  const tests = getTestLinks();

  if (!taskName) {
    taskName = getTaskId();
  }

  console.log("task is", taskName);

  tests.forEach((test, i) => {
    let inputPath = "";
    let outputPath = "";

    if (testFormat === "Themis") {
      let formattedId = (i + 1).toString().padStart(2, "0");
      inputPath = `${taskName}/Test${formattedId}/${taskName}.inp`;
      outputPath = `${taskName}/Test${formattedId}/${taskName}.out`;
    } else if (testFormat === "DMOJ") {
      inputPath = `${taskName}.${i + 1}.in`;
      outputPath = `${taskName}.${i + 1}.out`;
    } else if (testFormat === "CF") {
      inputPath = `${taskName}.${i + 1}.in`;
    } else {
      throw "test format not allowed";
    }

    zip.file(inputPath, urlToPromise(test.inputRef));
    zip.file(outputPath, urlToPromise(test.outputRef));
  });

  console.log("test created");

  zip
    .generateAsync({
      type: "blob",
      compression: "DEFLATE",
      streamFiles: true,
      compressionOptions: {
        level: 6,
      },
    })
    .then(function callback(blob) {
      saveAs(blob, `${taskName}.zip`);
      console.log("test downloaded");
    });
}
