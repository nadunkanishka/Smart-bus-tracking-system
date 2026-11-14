// Stand-in for react-native under Node: the code under test only reads Platform.OS.
export const Platform = { OS: 'web', select: (o) => o.web ?? o.default };
