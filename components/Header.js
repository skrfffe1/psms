import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Header = ({ title, subtitle }) => (
  <View style={styles.wrapper}>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: SIZES.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default Header;
