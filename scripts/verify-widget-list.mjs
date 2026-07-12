function hasWidgetDimensions(info) {
  return info.width > 0 && info.height > 0;
}

function isWidgetInstance(info) {
  return info.widgetId > 0;
}

function isUserConfiguredWidget(config) {
  return config?.configured === true;
}

function ensureWidgetListedConfig(widgetId, widgetName, existing) {
  return {
    cityId: existing?.cityId ?? 'city-1',
    chartType: existing?.chartType ?? 'temperature',
    configured: true,
    widgetName,
  };
}

function loadResolvedWidgetEntries(widgetInfos, storedConfigs) {
  const upgraded = { ...storedConfigs };

  for (const info of widgetInfos) {
    if (!isWidgetInstance(info) || !hasWidgetDimensions(info)) {
      continue;
    }

    const stored = upgraded[String(info.widgetId)];
    if (stored && stored.configured !== true) {
      upgraded[String(info.widgetId)] = {
        ...stored,
        configured: true,
        widgetName: stored.widgetName ?? info.widgetName,
      };
    }
  }

  const entries = [];

  for (const [widgetId, config] of Object.entries(upgraded)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || !isUserConfiguredWidget(config)) {
      continue;
    }

    entries.push({ widgetId: id, cityId: config.cityId });
  }

  return entries.sort((left, right) => left.widgetId - right.widgetId);
}

function pruneUnconfiguredWidgetConfigs(storedConfigs) {
  const removed = [];

  for (const [widgetId, config] of Object.entries(storedConfigs)) {
    const id = Number(widgetId);
    if (!Number.isFinite(id) || config.configured !== true) {
      removed.push(id);
    }
  }

  return removed;
}

let failed = 0;

const defaultCityOneWidget = ensureWidgetListedConfig(
  11,
  'TemperatureWidget',
  null,
);
if (defaultCityOneWidget.cityId !== 'city-1' || defaultCityOneWidget.configured !== true) {
  console.error('Expected default optional widget config to use city-1 and configured=true');
  failed += 1;
} else {
  console.log('OK: default optional widget config uses city-1');
}

const afterRefresh = loadResolvedWidgetEntries(
  [{ widgetId: 11, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    11: ensureWidgetListedConfig(11, 'TemperatureWidget', null),
  },
);
if (afterRefresh.length !== 1 || afterRefresh[0].cityId !== 'city-1') {
  console.error('Expected default city-1 widget to appear after refresh/list sync');
  failed += 1;
} else {
  console.log('OK: default city-1 widget appears in list');
}

const legacyDefault = loadResolvedWidgetEntries(
  [{ widgetId: 12, widgetName: 'TemperatureWidget', width: 250, height: 110 }],
  {
    12: { cityId: 'city-1', chartType: 'temperature' },
  },
);
if (legacyDefault.length !== 1 || legacyDefault[0].cityId !== 'city-1') {
  console.error('Expected legacy city-1 config to upgrade into the widget list');
  failed += 1;
} else {
  console.log('OK: legacy city-1 config upgrades into the widget list');
}

const phantomWithoutConfig = loadResolvedWidgetEntries(
  [{ widgetId: 9, widgetName: 'MetricWidget', width: 56, height: 56 }],
  {},
);
if (phantomWithoutConfig.length !== 0) {
  console.error('Expected widget without configured storage entry to stay hidden');
  failed += 1;
} else {
  console.log('OK: widget without configured storage entry stays hidden');
}

const removedUnconfigured = pruneUnconfiguredWidgetConfigs({
  42: { cityId: 'current', chartType: 'temperature', configured: true },
  100: { cityId: 'city-2', chartType: 'temperature', configured: false },
});
if (!removedUnconfigured.includes(100) || removedUnconfigured.includes(42)) {
  console.error('Expected prune to remove only unconfigured configs');
  failed += 1;
} else {
  console.log('OK: prune removes only unconfigured configs');
}

if (failed > 0) {
  process.exit(1);
}

console.log('OK: default city-1 widgets list correctly and phantoms stay hidden');
