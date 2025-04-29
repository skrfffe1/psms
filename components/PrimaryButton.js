import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const PrimaryButton = ({ label, onPress, style, textStyle }) => (
  <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
    <Text style={[styles.text, textStyle]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.padding / 1.5,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  text: {
    color: COLORS.surface,
    fontSize: SIZES.md,
    fontWeight: 'bold',
  },
});

export default PrimaryButton;
