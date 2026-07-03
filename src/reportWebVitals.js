const reportWebVitals = (onPerfEntry) => {
  if (!onPerfEntry || !(onPerfEntry instanceof Function)) {
    return;
  }

  import('web-vitals').then((webVitals) => {
    // Supports both older CRA web-vitals APIs (get*) and newer APIs (on*).
    const report = (newName, oldName) => {
      const metricFn = webVitals[newName] || webVitals[oldName];
      if (typeof metricFn === 'function') {
        metricFn(onPerfEntry);
      }
    };

    report('onCLS', 'getCLS');
    report('onFCP', 'getFCP');
    report('onLCP', 'getLCP');
    report('onTTFB', 'getTTFB');
    report('onINP', 'getFID');
  });
};

export default reportWebVitals;
