const reportWebVitals = (onPerfEntry) => {
  if (!onPerfEntry || typeof onPerfEntry !== 'function') return;

  import('web-vitals').then((webVitals) => {
    const report = (newName, oldName) => {
      const metricFn = webVitals[newName] || webVitals[oldName];
      if (typeof metricFn === 'function') metricFn(onPerfEntry);
    };

    report('onCLS', 'getCLS');
    report('onFCP', 'getFCP');
    report('onLCP', 'getLCP');
    report('onTTFB', 'getTTFB');
    report('onINP', 'getFID');
  }).catch(() => undefined);
};

export default reportWebVitals;
