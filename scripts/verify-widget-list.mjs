function hasWidgetDimensions(info) {
  return info.width > 0 && info.height > 0;
}

function isWidgetInstance(info) {
  return info.widgetId > 0;
}

async function resolveWidgetListEntry(info, getConfig, saveConfig) {
  if (!isWidgetInstance(info)) {
    return null;
  }

  const storedConfig = await getConfig(info.widgetId);
  const placed = hasWidgetDimensions(info);

  if (!placed && !storedConfig) {
    return null;
  }

  const config = storedConfig ?? { cityId: 'city-1', chartType: 'temperature' };
  if (!storedConfig) {
    await saveConfig(info.widgetId, config);
  }

  return {
    ...info,
    width: placed ? info.width : Math.max(info.width, 110),
    height: placed ? info.height : Math.max(info.height, 110),
    cityId: config.cityId,
    chartType: config.chartType,
  };
}

async function runScenario(name, info, storedConfig) {
  const saved = [];
  const entry = await resolveWidgetListEntry(
    info,
    async () => storedConfig,
    async (_widgetId, config) => {
      saved.push(config);
    },
  );

  console.log(`OK: ${name} -> ${entry ? `widget ${entry.widgetId}` : 'hidden'}`);
  return { entry, saved };
}

let failed = 0;

const firstConfigured = await runScenario(
  'first widget with saved config but zero dimensions',
  { widgetId: 42, widgetName: 'TemperatureWidget', width: 0, height: 0 },
  { cityId: 'current', chartType: 'temperature' },
);
if (!firstConfigured.entry || firstConfigured.entry.cityId !== 'current') {
  console.error('Expected configured first widget to appear');
  failed += 1;
}

const optionalDefault = await runScenario(
  'placed widget without config gets a default saved',
  { widgetId: 7, widgetName: 'MetricWidget', width: 56, height: 56 },
  null,
);
if (!optionalDefault.entry || optionalDefault.saved.length !== 1) {
  console.error('Expected placed widget without config to be listed and saved');
  failed += 1;
}

const phantom = await runScenario(
  'preview entry without config stays hidden',
  { widgetId: 0, widgetName: 'TemperatureWidget', width: 250, height: 110 },
  null,
);
if (phantom.entry) {
  console.error('Expected preview widget to stay hidden');
  failed += 1;
}

const orphanPreview = await runScenario(
  'positive id without config or dimensions stays hidden',
  { widgetId: 99, widgetName: 'TemperatureWidget', width: 0, height: 0 },
  null,
);
if (orphanPreview.entry) {
  console.error('Expected dimensionless widget without config to stay hidden');
  failed += 1;
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: widget list resolver handles first widget, defaults, and phantoms');
