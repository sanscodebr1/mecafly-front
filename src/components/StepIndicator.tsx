import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { wp, hp, isWeb } from '../utils/responsive';
import { fonts } from '../constants/fonts';

interface StepIndicatorProps {
  /** 1-based current step */
  currentStep: number;
  /** 3-step variant toggle */
  useCompactVariant?: boolean;
  /** optional custom labels */
  stepsOverride?: { label: string }[];
}

const DEFAULT_STEPS = [
  { label: 'Informações pessoais' },
  { label: 'Dados da entrega' },
  { label: 'Formas de envio' },
  { label: 'Formas de pagamento' },
];

const COMPACT_STEPS = [
  { label: 'Endereço' },
  { label: 'Forma de pagamento' },
  { label: 'Finalizar' },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  useCompactVariant = false,
  stepsOverride,
}) => {
  const steps = stepsOverride ?? (useCompactVariant ? COMPACT_STEPS : DEFAULT_STEPS);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {steps.map((step, idx) => {
          const stepNumber = idx + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          // connector logic:
          const showLeft = idx !== 0;
          const showRight = idx !== steps.length - 1;
          const leftCompleted = stepNumber <= currentStep;     // reached or active
          const rightCompleted = stepNumber < currentStep;     // fully completed

          return (
            <View key={step.label} style={styles.stepCell}>
              {/* LEFT HALF CONNECTOR */}
              {showLeft && (
                <View
                  style={[
                    styles.connectorHalf,
                    styles.connectorLeft,
                    leftCompleted ? styles.connectorCompleted : styles.connectorDefault,
                  ]}
                />
              )}

              {/* RIGHT HALF CONNECTOR */}
              {showRight && (
                <View
                  style={[
                    styles.connectorHalf,
                    styles.connectorRight,
                    rightCompleted ? styles.connectorCompleted : styles.connectorDefault,
                  ]}
                />
              )}

              {/* CIRCLE */}
              <View
                style={[
                  styles.circle,
                  isActive && styles.circleActive,
                  isCompleted && styles.circleCompleted,
                ]}
              >
                <Text style={styles.circleText}>{stepNumber}</Text>
              </View>

              {/* LABEL (always centered under the circle) */}
              <Text style={styles.label} numberOfLines={3}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const LINE_HEIGHT = 5;
const CIRCLE_SIZE = isWeb ? wp('6%') : wp('8%');

const styles = StyleSheet.create({
  container: {
    marginTop: hp('-3%'),
    marginBottom: hp('3%'),
    ...(isWeb && { marginVertical: hp('1%'), marginBottom: hp('2%') }),
  },

  // Each step is a full-width cell; label stays aligned under its circle.
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: wp('3%'),
  },
  stepCell: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: wp('1%'),
  },

  // Half connectors: span from cell edges to circle center.
  connectorHalf: {
    position: 'absolute',
    top: (CIRCLE_SIZE as number) / 2 - LINE_HEIGHT / 2,
    height: LINE_HEIGHT,
    borderRadius: 3,
    zIndex: 0,         // stay behind the circle
  },
  connectorLeft: {
    left: 0,
    width: '50%',      // from left edge to circle center
  },
  connectorRight: {
    right: 0,
    width: '50%',      // from circle center to right edge
  },
  connectorDefault: { backgroundColor: '#ccc' },
  connectorCompleted: { backgroundColor: '#ccc' },

  // Circle sits above the line
  circle: {
    width: CIRCLE_SIZE as number,
    height: CIRCLE_SIZE as number,
    borderRadius: (CIRCLE_SIZE as number) / 2,
    backgroundColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleActive: { backgroundColor: '#D62D2D' },
  circleCompleted: { backgroundColor: '#22D883' },
  circleText: {
    color: '#fff',
    fontSize: isWeb ? wp('3%') : wp('4%'),
    textAlign: 'center',
    fontFamily: fonts.bold700,
  },

  label: {
    marginTop: hp('0.8%'),
    textAlign: 'center',
    fontFamily: fonts.bold700,
    color: '#000000',
    fontSize: isWeb ? wp('2.2%') : wp('2.6%'),
    lineHeight: isWeb ? wp('2.6%') : wp('3.6%'),
  },
});
