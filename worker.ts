self.onmessage = event => {
  if (event.data === "DONE") {
    process.exit();
  } else {
    postMessage(event.data.toUpperCase());
  }
};

