export const fontFamily = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const;

export const typography = {
  appTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  appSubtitle: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    fontFamily: fontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitleLarge: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  modalTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 34,
  },
  metricValue: {
    fontFamily: fontFamily.bold,
    fontSize: 48,
    lineHeight: 52,
    fontVariant: ['tabular-nums'] as const,
  },
  metricStat: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
    fontVariant: ['tabular-nums'] as const,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20,
  },
  link: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
} as const;
