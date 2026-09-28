// react-native-maps'in web sürümü yok. Web'de (hekim paneli) harita ekranları
// açılmadığı için boş bir yer tutucu yeter; mobil derlemeyi etkilemez.
const React = require('react');
const { View, Text } = require('react-native');

const MapView = React.forwardRef(function MapView(props, ref) {
  React.useImperativeHandle(ref, () => ({ animateToRegion() {}, fitToCoordinates() {} }));
  return React.createElement(
    View,
    { style: [{ backgroundColor: '#E9E5DE', alignItems: 'center', justifyContent: 'center' }, props.style] },
    React.createElement(Text, { style: { color: '#6B665E' } }, 'Harita yalnızca uygulamada')
  );
});
const Noop = () => null;

module.exports = { __esModule: true, default: MapView, Marker: Noop, Callout: Noop, Circle: Noop, PROVIDER_GOOGLE: 'google', PROVIDER_DEFAULT: null };
