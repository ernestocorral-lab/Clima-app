import React from 'react';
import { FlexWidget, SvgWidget, TextWidget } from 'react-native-android-widget';
import type { WidgetInfo } from 'react-native-android-widget';
import { WidgetCitySnapshot } from '../storage/widgetData';
import { getLocationLabel } from '../utils/formatCity';
import { formatNowLabel } from '../utils/formatWeather';
import { getTemperatureValueColor } from '../utils/temperatureLevel';
import { getUvIndexLevel } from '../utils/uvIndexLevel';
import { getWeatherDescription } from '../utils/weatherCodes';
import { buildCitySummaryDeepLink } from '../utils/widgetDeepLink';
import { formatWidgetStaleness } from '../utils/widgetStaleness';
import { buildWidgetWeatherIconSvg } from '../utils/widgetWeatherIconSvg';
import { colors } from '../theme';
import { t } from '../i18n';

export function renderCitySummaryWidget(
  snapshot: WidgetCitySnapshot | null,
  widgetInfo: Pick<WidgetInfo, 'width' | 'height'>,
) {
  const current = snapshot?.current;
  const staleness = formatWidgetStaleness(snapshot?.updatedAt);
  const scale = Math.min(widgetInfo.width, widgetInfo.height) / 110;
  const locationSize = Math.max(10, Math.round(12 * scale));
  const nowSize = Math.max(9, Math.round(11 * scale));
  const tempSize = Math.max(13, Math.round(22 * scale * 0.8));
  const conditionSize = Math.max(9, Math.round(11 * scale));
  const statSize = Math.max(16, Math.round(20 * scale));
  const iconSize = Math.max(18, Math.round(22 * scale));

  if (!snapshot || !current) {
    return (
      <FlexWidget
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: colors.surfaceElevated,
          padding: 8,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 16,
        }}
      >
        <TextWidget
          text={t('common.noData')}
          style={{
            color: colors.textMuted,
            fontSize: locationSize,
            fontWeight: '600',
          }}
        />
      </FlexWidget>
    );
  }

  const locationLabel = getLocationLabel(
    snapshot.cityId,
    snapshot.cityLabel,
    snapshot.cityId === 'current' ? current.cityName : undefined,
    current.timezone,
  );
  const tempColor = getTemperatureValueColor(current.temperature);
  const apparentColor = getTemperatureValueColor(current.apparentTemperature);
  const uvLevel = getUvIndexLevel(current.uvIndex);
  const conditionText = getWeatherDescription(current.weatherCode);
  const widgetDeepLink = buildCitySummaryDeepLink(snapshot.cityId);

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: widgetDeepLink }}
      accessibilityLabel={t('widget.citySummaryAccessibility', {
        city: locationLabel,
        value: `${Math.round(current.temperature)}°`,
      })}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: colors.surfaceElevated,
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: 'column',
        alignItems: 'center',
        borderRadius: 16,
      }}
    >
      <TextWidget
        text={locationLabel}
        maxLines={1}
        truncate="END"
        style={{
          color: colors.textPrimary,
          fontSize: locationSize,
          fontWeight: 'bold',
          marginBottom: 1,
        }}
      />
      <TextWidget
        text={formatNowLabel(current.observedAt, current.countryCodeAlpha2)}
        maxLines={1}
        truncate="END"
        style={{
          color: colors.accentSoft,
          fontSize: nowSize,
          fontWeight: '600',
          marginBottom: staleness ? 0 : 2,
        }}
      />
      {staleness ? (
        <TextWidget
          text={staleness}
          maxLines={1}
          truncate="END"
          style={{
            color: '#FF9B7A',
            fontSize: Math.max(8, nowSize - 2),
            fontWeight: '600',
            marginBottom: 2,
          }}
        />
      ) : null}
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 1,
        }}
      >
        <SvgWidget
          svg={buildWidgetWeatherIconSvg(current.weatherCode, iconSize)}
          style={{
            width: iconSize,
            height: iconSize,
            marginRight: 2,
          }}
        />
        <TextWidget
          text={`${Math.round(current.temperature)}°`}
          maxLines={1}
          style={{
            color: tempColor as typeof colors.textPrimary,
            fontSize: tempSize,
            fontWeight: 'bold',
          }}
        />
        <TextWidget
          text={` (${Math.round(current.apparentTemperature)}°)`}
          maxLines={1}
          style={{
            color: apparentColor as typeof colors.textPrimary,
            fontSize: tempSize,
            fontWeight: 'bold',
          }}
        />
      </FlexWidget>
      <TextWidget
        text={conditionText}
        maxLines={2}
        truncate="END"
        style={{
          color: colors.textSecondary,
          fontSize: conditionSize,
          fontWeight: '500',
          textAlign: 'center',
          marginBottom: 2,
          width: 'match_parent',
        }}
      />
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          width: 'match_parent',
        }}
      >
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: 'match_parent',
            marginBottom: 2,
          }}
        >
          <TextWidget
            text={`💧 ${Math.round(current.humidity)}%`}
            maxLines={1}
            style={{
              color: colors.textPrimary,
              fontSize: statSize,
              fontWeight: '600',
            }}
          />
          <TextWidget
            text={`💨 ${Math.round(current.windGust)} km/h`}
            maxLines={1}
            style={{
              color: colors.textPrimary,
              fontSize: statSize,
              fontWeight: '600',
            }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="⚡ "
            maxLines={1}
            style={{
              color: colors.textPrimary,
              fontSize: statSize,
              fontWeight: '600',
            }}
          />
          <TextWidget
            text={current.uvIndex.toFixed(1)}
            maxLines={1}
            style={{
              color: uvLevel.color as typeof colors.textPrimary,
              fontSize: statSize,
              fontWeight: '600',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
