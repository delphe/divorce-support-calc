import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

const WeightSliderRow = React.memo(({
  keyName, label, basePct, effectivePct, defaultPct,
  isOverridden, isManual, dotColor, accentColor,
  onChangeWeight, setManualOverrides,
}) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-gray-700">{label}</label>
        {isOverridden && (
          <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 rounded px-1.5 py-0.5 font-semibold leading-none">
            ⚡ Floor: {effectivePct}%
          </span>
        )}
        {isManual && !isOverridden && (
          <button
            onClick={() => setManualOverrides(prev => { const n = new Set(prev); n.delete(keyName); return n; })}
            className="text-xs text-indigo-500 underline hover:text-indigo-700"
          >
            Restore auto
          </button>
        )}
      </div>
      <span className="text-xs font-bold w-12 text-right" style={{ color: dotColor }}>
        {effectivePct}%
      </span>
    </div>
    <input
      type="range"
      min="2"
      max="40"
      value={effectivePct}
      onChange={(e) => onChangeWeight(keyName, Number(e.target.value) / 100)}
      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
      style={{ accentColor }}
    />
    {isOverridden && basePct < effectivePct && (
      <p className="text-xs text-amber-700 mt-0.5">
        Auto-override active (floor: {effectivePct}%). Drag right to take manual control.
      </p>
    )}
  </div>
));

const CurrencyInputComponent = ({ label, value, onChange, helpText, rationale, children }) => {
  const inputRef = React.useRef(null);
  const [displayValue, setDisplayValue] = React.useState(String(value || ''));

  const formatCurrency = (num) => {
    if (!num) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-2 text-gray-600 font-semibold">$</span>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          onBlur={(e) => {
            const num = parseInt(e.target.value.replace(/[^0-9-]/g, ''), 10);
            const final = isNaN(num) ? 0 : num;
            onChange(final);
            setDisplayValue(formatCurrency(final).replace('$', ''));
          }}
          onFocus={() => setDisplayValue(value ? String(value) : '')}
          placeholder="0"
          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mt-2">
        {helpText && <p className="text-xs text-gray-600">{helpText}</p>}
        {rationale && (
          <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 mt-2">
            <span className="font-semibold">Calculation: </span>{rationale}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

const WeightsPanel = React.memo(({
  showWeightsPanel, setShowWeightsPanel,
  weights, effectiveWeights, overrideInfo, manualOverrides,
  DEFAULT_WEIGHTS, WEIGHT_LABELS, DONUT_COLORS,
  handleWeightChange, setWeights, setManualOverrides,
}) => {
  const donutData = Object.keys(effectiveWeights).map((key, i) => ({
    name: WEIGHT_LABELS[key],
    value: Math.round(effectiveWeights[key] * 100),
    color: DONUT_COLORS[i],
    key,
  }));

  return (
    <div className="mb-8">
      <button
        onClick={() => setShowWeightsPanel(v => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors mb-4"
      >
        <span>{showWeightsPanel ? '▼' : '▶'}</span>
        Customize Factor Weights
      </button>

      {showWeightsPanel && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex flex-col md:flex-row gap-8">

            <div className="flex-1">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Factor Weights</h3>
                <button
                  onClick={() => { setWeights(DEFAULT_WEIGHTS); setManualOverrides(new Set()); }}
                  className="text-xs text-gray-500 hover:text-indigo-600 underline transition-colors"
                >
                  Reset to defaults
                </button>
              </div>

              {Object.keys(weights).map((key, i) => {
                const basePct = Math.round(weights[key] * 100);
                const effectivePct = Math.round(effectiveWeights[key] * 100);
                const defaultPct = Math.round(DEFAULT_WEIGHTS[key] * 100);
                const isOverridden = !!overrideInfo[key];
                const isAbove = effectivePct > defaultPct;
                const isBelow = effectivePct < defaultPct;
                const dotColor = isOverridden ? '#F59E0B' : isAbove ? DONUT_COLORS[i] : isBelow ? '#9CA3AF' : '#6B7280';
                return (
                  <WeightSliderRow
                    key={key}
                    keyName={key}
                    label={WEIGHT_LABELS[key]}
                    basePct={basePct}
                    effectivePct={effectivePct}
                    defaultPct={defaultPct}
                    isOverridden={isOverridden}
                    isManual={manualOverrides.has(key)}
                    dotColor={dotColor}
                    accentColor={isOverridden ? '#F59E0B' : DONUT_COLORS[i]}
                    onChangeWeight={handleWeightChange}
                    setManualOverrides={setManualOverrides}
                  />
                );
              })}

              <div className="mt-4 pt-3 border-t border-gray-300 flex justify-between text-xs text-gray-500">
                <span>Total (effective)</span>
                <span className="font-bold text-green-600">
                  {Object.values(effectiveWeights).reduce((s, v) => s + Math.round(v * 100), 0)}%
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Min 2% · Max 40% per factor. Other weights adjust automatically.
              </p>
            </div>

            <div className="md:w-64 flex flex-col items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2">Weight Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                    {donutData.map((entry) => <Cell key={entry.key} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-2 space-y-1">
                {donutData.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="flex-1">{entry.name}</span>
                    <span className="font-semibold">{entry.value}%</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
});

const SliderComp = ({ label, value, onChange, description, rationale, warning }) => {
  const showWarning = warning && (
    warning.direction === "below"
      ? value <= warning.threshold
      : value >= warning.threshold
  );
  return (
    <div className="mb-5">
      <div className="flex justify-between items-baseline mb-2">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-lg font-bold text-blue-600">{value}</span>
      </div>
      <div className="group relative">
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="absolute left-0 right-0 flex justify-between text-xs text-gray-500 mt-1 px-1">
          <span>1 (Low)</span>
          <span>10 (High)</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-6">{description}</p>
      {rationale && (
        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 mt-2">
          <span className="font-semibold">Calculation: </span>{rationale}
        </p>
      )}
      {showWarning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded px-3 py-2 mt-2">
          <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Weight override applied: </span>{warning.message}
          </p>
        </div>
      )}
    </div>
  );
};

const AgeSliderComp = ({ label, value, onChange, description, rationale, warning }) => {
  const totalRange = 75 - 18;
  const markerAges = [35, 50, 67];
  const markers = markerAges.map(age => ({
    age,
    label: age === 35 ? 'Early' : age === 50 ? 'Mid-Career' : 'Near Retirement',
    percent: ((age - 18) / totalRange) * 100
  }));

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-2">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-lg font-bold text-blue-600">
          {value === 18 ? '18 or younger' : value === 75 ? '75 or older' : `${value} years old`}
        </span>
      </div>
      <div className="relative pt-2">
        <input
          type="range"
          min="18"
          max="75"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="relative -top-1 h-1 w-full">
          {markers.map((marker) => (
            <div key={marker.age} className="absolute w-1 h-3 bg-gray-400 transform -translate-x-1/2"
              style={{ left: `${marker.percent}%` }} />
          ))}
        </div>
        <div className="relative h-5 w-full">
          {markers.map((marker) => (
            <div key={`label-${marker.age}`} className="absolute text-xs text-gray-600 transform -translate-x-1/2 mt-1"
              style={{ left: `${marker.percent}%` }}>
              <div className="whitespace-nowrap">{marker.age}</div>
              <div className="text-gray-500 text-xs">{marker.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-10">
        <span>18</span>
        <span>75</span>
      </div>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
      {rationale && (
        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 mt-2">
          <span className="font-semibold">Calculation: </span>{rationale}
        </p>
      )}
      {warning && value >= warning.threshold && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded px-3 py-2 mt-2">
          <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Weight override applied: </span>{warning.message}
          </p>
        </div>
      )}
    </div>
  );
};

const MarriageSliderComp = ({ label, value, onChange, description, rationale, warning }) => {
  const totalRange = 40 - 1;
  const markerYears = [5, 10, 16, 20];
  const markers = markerYears.map(years => ({
    years,
    label: years === 5 ? 'Short-Term' : years === 10 ? 'Established' : years === 16 ? 'Long-Term' : 'Substantial',
    percent: ((years - 1) / totalRange) * 100
  }));

  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-2">
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
        <span className="text-lg font-bold text-blue-600">
          {value === 1 ? '1 year' : value === 40 ? '40+ years' : `${value} years`}
        </span>
      </div>
      <div className="relative pt-2">
        <input
          type="range"
          min="1"
          max="40"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="relative -top-1 h-1 w-full">
          {markers.map((marker) => (
            <div key={marker.years} className="absolute w-1 h-3 bg-gray-400 transform -translate-x-1/2"
              style={{ left: `${marker.percent}%` }} />
          ))}
        </div>
        <div className="relative h-5 w-full">
          {markers.map((marker) => (
            <div key={`label-${marker.years}`} className="absolute text-xs text-gray-600 transform -translate-x-1/2 mt-1"
              style={{ left: `${marker.percent}%` }}>
              <div className="whitespace-nowrap">{marker.years} yr</div>
              <div className="text-gray-500 text-xs">{marker.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-10">
        <span>1</span>
        <span>40</span>
      </div>
      <p className="text-xs text-gray-600 mt-2">{description}</p>
      {rationale && (
        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 mt-2">
          <span className="font-semibold">Calculation: </span>{rationale}
        </p>
      )}
      {warning && value >= warning.threshold && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded px-3 py-2 mt-2">
          <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Weight override applied: </span>{warning.message}
          </p>
        </div>
      )}
    </div>
  );
};

function App() {
  // Input section state
  const [lowAmount, setLowAmount] = useState(1000);
  const [midAmount, setMidAmount] = useState(1500);
  const [highAmount, setHighAmount] = useState(2000);
  const [lowDuration, setLowDuration] = useState(60);
  const [highDuration, setHighDuration] = useState(120);

  // Slider state
  // Recipient factors
  const [recipientEarning, setRecipientEarning] = useState(5);
  const [standardOfLiving, setStandardOfLiving] = useState(5);
  const [ageOfRecipient, setAgeOfRecipient] = useState(45); // Age slider: 18-75
  const [healthOfRecipient, setHealthOfRecipient] = useState(5);
  const [educationNeeded, setEducationNeeded] = useState(5);
  const [childcareResponsibilities, setChildcareResponsibilities] = useState(5);

  // Marriage factors
  const [lengthOfMarriage, setLengthOfMarriage] = useState(7); // Marriage length: 1-40 years
  const [careerSacrifice, setCareerSacrifice] = useState(5);

  // Financial factors
  const [recipientAssets, setRecipientAssets] = useState(0); // Total marital assets awarded to support recipient
  const [payorAssets, setPayorAssets] = useState(0);         // Total marital assets awarded to support payor
  const [assetMode, setAssetMode] = useState('proportional'); // 'proportional' | 'exact'
  const [payorAbilityToPay, setPayorAbilityToPay] = useState(5);

  // Duration adjustment slider - allows user to shift duration/amount while keeping obligation constant
  const [adjustedDuration, setAdjustedDuration] = useState(null);

  // Net asset offset: half the difference, because an equal split means each party gets half the total.
  // The excess above that equal share is what offsets support.
  // Positive = recipient received more than their fair share → reduces monthly support.
  // Negative = recipient received less than their fair share → increases monthly support.
  const assetsAwarded = (recipientAssets - payorAssets) / 2;

  // Default weights
  const DEFAULT_WEIGHTS = {
    recipientEarning: 0.14,
    standardOfLiving: 0.13,
    lengthOfMarriage: 0.20,
    ageOfRecipient: 0.09,
    healthOfRecipient: 0.09,
    careerSacrifice: 0.12,
    educationNeeded: 0.08,
    payorAbilityToPay: 0.08,
    childcareResponsibilities: 0.07,
  };

  const WEIGHT_LABELS = {
    recipientEarning: 'Earning Potential',
    standardOfLiving: 'Standard of Living',
    lengthOfMarriage: 'Length of Marriage',
    ageOfRecipient: 'Age of Recipient',
    healthOfRecipient: 'Health of Recipient',
    careerSacrifice: 'Career Sacrifice',
    educationNeeded: 'Education Needed',
    payorAbilityToPay: "Payor's Ability to Pay",
    childcareResponsibilities: 'Childcare Responsibilities',
  };

  const DONUT_COLORS = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B',
    '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#EC4899'
  ];

  // Dynamic weights state
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [showWeightsPanel, setShowWeightsPanel] = useState(false);
  // Tracks keys where the user has manually moved the slider, bypassing auto-overrides
  const [manualOverrides, setManualOverrides] = useState(new Set());

  // handleWeightChange is defined after effectiveWeights below so it can reference it

  // Weighted marriage length factor reflecting legal thresholds
  const getMarriageLengthFactor = (years) => {
    // Maps marriage length to a factor between -1 and 1
    // 1-5 years: bottom 20% (-1 to -0.6) - weak support
    // 5-10 years: 20-45% (-0.6 to -0.1)
    // 10-16 years: 45-70% (-0.1 to 0.4)
    // 16-20 years: 70-90% (0.4 to 0.8) - extended duration threshold
    // 20-40 years: 90-100% (0.8 to 1.0) - substantial support
    
    if (years <= 5) {
      return -1 + (years - 1) / 4 * 0.4;
    } else if (years <= 10) {
      return -0.6 + (years - 5) / 5 * 0.5;
    } else if (years <= 16) {
      return -0.1 + (years - 10) / 6 * 0.5;
    } else if (years <= 20) {
      return 0.4 + (years - 16) / 4 * 0.4;
    } else {
      return 0.8 + (years - 20) / 20 * 0.2;
    }
  };

  // Compute effective weights — applies automatic overrides when factors are near-determinative.
  // The override sets a MINIMUM floor, not a fixed value — if the user manually sets a weight
  // higher than the boost floor, their value is used. If they set it lower, the floor applies.
  const effectiveWeights = useMemo(() => {
    const ew = { ...weights };

    const applyBoost = (key, boostFloor) => {
      // Skip if user has manually taken control of this key
      if (manualOverrides.has(key)) return;
      if (ew[key] >= boostFloor) return;
      const excess = boostFloor - ew[key];
      const otherKeys = Object.keys(ew).filter(k => k !== key);
      const otherTotal = otherKeys.reduce((s, k) => s + ew[k], 0);
      otherKeys.forEach(k => { ew[k] = Math.max(0.02, ew[k] - excess * (ew[k] / otherTotal)); });
      ew[key] = boostFloor;
      const total = Object.values(ew).reduce((s, v) => s + v, 0);
      Object.keys(ew).forEach(k => { ew[k] /= total; });
    };

    if (healthOfRecipient <= 2)         applyBoost('healthOfRecipient', 0.20);
    if (ageOfRecipient >= 67)           applyBoost('ageOfRecipient', 0.15);
    if (childcareResponsibilities >= 9) applyBoost('childcareResponsibilities', 0.16);

    return ew;
  }, [weights, healthOfRecipient, ageOfRecipient, childcareResponsibilities, manualOverrides]);

  // Build override summary for warning messages — maps key → { boostedTo, originalDefault }
  const overrideInfo = useMemo(() => {
    const info = {};
    if (healthOfRecipient <= 2 && weights.healthOfRecipient < 0.20 && !manualOverrides.has('healthOfRecipient'))
      info.healthOfRecipient = { boostedTo: Math.round(effectiveWeights.healthOfRecipient * 100) };
    if (ageOfRecipient >= 67 && weights.ageOfRecipient < 0.15 && !manualOverrides.has('ageOfRecipient'))
      info.ageOfRecipient = { boostedTo: Math.round(effectiveWeights.ageOfRecipient * 100) };
    if (childcareResponsibilities >= 9 && weights.childcareResponsibilities < 0.16 && !manualOverrides.has('childcareResponsibilities'))
      info.childcareResponsibilities = { boostedTo: Math.round(effectiveWeights.childcareResponsibilities * 100) };
    return info;
  }, [effectiveWeights, weights, healthOfRecipient, ageOfRecipient, childcareResponsibilities, manualOverrides]);

  // Adjust one weight and redistribute the remainder proportionally.
  // Operates against effectiveWeights as the baseline so override-affected sliders respond correctly.
  const handleWeightChange = useCallback((key, newValue) => {
    const clamped = Math.max(0.02, Math.min(0.40, newValue));
    const delta = clamped - weights[key];
    const otherKeys = Object.keys(weights).filter(k => k !== key);
    const otherTotal = otherKeys.reduce((sum, k) => sum + weights[k], 0);

    const newWeights = { ...weights, [key]: clamped };
    otherKeys.forEach(k => {
      const proportion = weights[k] / otherTotal;
      newWeights[k] = Math.max(0.02, weights[k] - delta * proportion);
    });

    const total = Object.values(newWeights).reduce((s, v) => s + v, 0);
    Object.keys(newWeights).forEach(k => { newWeights[k] = newWeights[k] / total; });

    setManualOverrides(prev => new Set([...prev, key]));
    setWeights(newWeights);
  }, [weights]);

  // Calculate the weighted adjustment factor (sliders only, excluding asset offset)
  const adjustmentFactor = useMemo(() => {
    // Convert slider values (1-10) to adjustment factors (-1 to 1)
    // For factors where higher values = higher support, we normalize as: (value - 5.5) / 4.5
    // For factors where higher values = lower support, we invert: (5.5 - value) / 4.5

    const factors = {
      recipientEarning: (5.5 - recipientEarning) / 4.5,
      standardOfLiving: (standardOfLiving - 5.5) / 4.5,
      lengthOfMarriage: getMarriageLengthFactor(lengthOfMarriage),
      ageOfRecipient: (ageOfRecipient - 46.5) / 28.5,
      healthOfRecipient: (5.5 - healthOfRecipient) / 4.5,  // Low value = poor health = higher support
      careerSacrifice: (careerSacrifice - 5.5) / 4.5,
      educationNeeded: (educationNeeded - 5.5) / 4.5,
      payorAbilityToPay: (payorAbilityToPay - 5.5) / 4.5,
      childcareResponsibilities: (childcareResponsibilities - 5.5) / 4.5,
    };

    let weightedFactor = 0;
    for (const [key, value] of Object.entries(factors)) {
      weightedFactor += value * effectiveWeights[key];
    }

    return Math.max(-1, Math.min(1, weightedFactor));
  }, [
    recipientEarning, standardOfLiving, lengthOfMarriage, ageOfRecipient,
    healthOfRecipient, careerSacrifice, educationNeeded,
    payorAbilityToPay, childcareResponsibilities, effectiveWeights
  ]);

  // Calculate estimated monthly amount with separate asset offset adjustment
  const estimatedMonthly = useMemo(() => {
    const range = highAmount - lowAmount;
    const adjustment = (adjustmentFactor * range) / 2;
    let estimate = midAmount + adjustment;
    estimate = Math.max(lowAmount, Math.min(highAmount, estimate));

    if (assetMode === 'proportional') {
      // Proportional: express offset as % of total obligation, shift monthly amount
      const midpointDuration = (lowDuration + highDuration) / 2;
      const totalObligation = midAmount * midpointDuration;
      const offsetPercentage = Math.max(-1, Math.min(1, assetsAwarded / totalObligation));
      if (offsetPercentage > 0) {
        estimate -= offsetPercentage * (estimate - lowAmount);
      } else if (offsetPercentage < 0) {
        estimate += Math.abs(offsetPercentage) * (highAmount - estimate);
      }
      return Math.max(lowAmount, Math.min(highAmount, estimate));
    } else {
      // Exact: return the slider-based estimate unchanged — exact subtraction is applied to total obligation
      return estimate;
    }
  }, [adjustmentFactor, lowAmount, midAmount, highAmount, assetsAwarded, lowDuration, highDuration, assetMode]);

  // Calculate estimated duration
  const estimatedDuration = useMemo(() => {
    // Duration is influenced by how long it will realistically take the recipient to become self-sufficient.
    // Marriage length is the dominant legal driver; age and health extend duration when re-entry is harder;
    // low earning potential and high education needed both extend the time to self-sufficiency;
    // payor ability has a modest moderating effect.
    const durationFactors = {
      marriage: getMarriageLengthFactor(lengthOfMarriage),          // 0.45 weight
      age: (ageOfRecipient - 46.5) / 28.5,                          // 0.20 weight
      health: (5.5 - healthOfRecipient) / 4.5,                      // 0.15 weight
      earning: (5.5 - recipientEarning) / 4.5,                      // 0.10 weight — low earning = longer to self-sufficiency
      education: (educationNeeded - 5.5) / 4.5,                     // 0.07 weight — more training needed = longer duration
      payorAbility: (payorAbilityToPay - 5.5) / 4.5,               // 0.03 weight
    };

    const weightedDuration = (
      durationFactors.marriage    * 0.45 +
      durationFactors.age         * 0.20 +
      durationFactors.health      * 0.15 +
      durationFactors.earning     * 0.10 +
      durationFactors.education   * 0.07 +
      durationFactors.payorAbility * 0.03
    );

    const durationRange = highDuration - lowDuration;
    const adjustment = (weightedDuration * durationRange) / 2;
    const estimate = lowDuration + (durationRange / 2) + adjustment;

    return Math.max(lowDuration, Math.min(highDuration, estimate));
  }, [lengthOfMarriage, ageOfRecipient, healthOfRecipient, recipientEarning, educationNeeded, payorAbilityToPay, lowDuration, highDuration]);

  // In exact mode: subtract asset offset from total obligation, then re-derive monthly from estimated duration
  const exactObligation = useMemo(() => {
    if (assetMode !== 'exact') return null;
    const rawObligation = estimatedMonthly * estimatedDuration;
    const adjusted = rawObligation - assetsAwarded;
    return Math.max(0, adjusted);
  }, [assetMode, estimatedMonthly, estimatedDuration, assetsAwarded]);

  // Monthly amount adjusted for exact mode (keeps duration fixed, reduces monthly)
  const exactMonthly = useMemo(() => {
    if (assetMode !== 'exact' || !exactObligation) return null;
    return exactObligation / estimatedDuration;
  }, [assetMode, exactObligation, estimatedDuration]);
  const percentageInRange = ((estimatedMonthly - lowAmount) / (highAmount - lowAmount)) * 100;

  // Duration slider extended bounds: hard minimum of 6 months, max is guideline high + 24 months
  const sliderDurationMin = 6;
  const sliderDurationMax = highDuration + 24;

  // Calculate adjusted monthly amount based on duration slider (keeps total obligation constant),
  // incorporating the net asset offset (already baked into estimatedMonthly / exactObligation).
  const adjustedMonthly = useMemo(() => {
    // The "canonical" displayed monthly before any duration adjustment
    const baseMonthly = assetMode === 'exact' && exactMonthly !== null ? exactMonthly : estimatedMonthly;

    // If the slider hasn't been touched, always return the canonical monthly exactly (avoids float drift)
    if (adjustedDuration === null) return baseMonthly;

    // Total obligation to redistribute: exact mode already has offset subtracted; proportional has it baked into baseMonthly
    const baseObligation = assetMode === 'exact' && exactObligation !== null
      ? exactObligation
      : estimatedMonthly * estimatedDuration;

    return adjustedDuration > 0 ? baseObligation / adjustedDuration : baseMonthly;
  }, [estimatedMonthly, estimatedDuration, adjustedDuration, assetMode, exactMonthly, exactObligation]);

  const SliderComponent = SliderComp;
  const AgeSliderComponent = AgeSliderComp;
  const MarriageSliderComponent = MarriageSliderComp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Spousal Maintenance Adjustment Tool
          </h1>
          <p className="text-gray-600">
            Enter results from the <a className="underline text-blue-500" href="https://www.superiorcourt.maricopa.gov/app/selfsuffcalc/" target="_blank">Arizona Spousal Maintenance Calculator</a> and adjust factors to refine your estimate
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Enter Calculator Results</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Low Monthly</label>
              <input
                type="number"
                value={lowAmount}
                onChange={(e) => setLowAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Midpoint Monthly</label>
              <input
                type="number"
                value={midAmount}
                onChange={(e) => setMidAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">High Monthly</label>
              <input
                type="number"
                value={highAmount}
                onChange={(e) => setHighAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration Low (mo)</label>
              <input
                type="number"
                value={lowDuration}
                onChange={(e) => setLowDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Duration High (mo)</label>
              <input
                type="number"
                value={highDuration}
                onChange={(e) => setHighDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sliders Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Step 2: Adjust Supporting Factors</h2>

          <WeightsPanel
            showWeightsPanel={showWeightsPanel}
            setShowWeightsPanel={setShowWeightsPanel}
            weights={weights}
            effectiveWeights={effectiveWeights}
            overrideInfo={overrideInfo}
            manualOverrides={manualOverrides}
            DEFAULT_WEIGHTS={DEFAULT_WEIGHTS}
            WEIGHT_LABELS={WEIGHT_LABELS}
            DONUT_COLORS={DONUT_COLORS}
            handleWeightChange={handleWeightChange}
            setWeights={setWeights}
            setManualOverrides={setManualOverrides}
          />

          {/* Recipient Factors */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipient Factors</h3>
            <SliderComponent
              label="Earning Potential of Recipient"
              value={recipientEarning}
              onChange={setRecipientEarning}
              description="Low earning potential → Higher support amount & longer duration | High earning potential → Lower support amount & shorter duration"
              rationale="Weighted at 14% — the highest of any single factor — because Arizona spousal maintenance is explicitly designed around self-sufficiency. Courts focus primarily on whether the recipient can support themselves, making this the most direct measure of ongoing need. A recipient with strong earning potential is expected to become self-sufficient quickly, reducing both the amount and duration of support."
            />
            <AgeSliderComponent
              label="Age of Recipient"
              value={ageOfRecipient}
              onChange={setAgeOfRecipient}
              description="Older age (harder to re-enter workforce) → Higher support | Younger age → Lower support"
              rationale="Weighted at 9% because age is an important but secondary factor — it influences earning potential rather than determining support on its own. Courts recognize that older recipients face real barriers re-entering the workforce after a long marriage, but age alone is not determinative. Its legal significance increases significantly past 50 and again at 67 when Social Security and retirement income attribution rules shift."
              warning={{
                threshold: 67,
                message: `Weight increased to ${overrideInfo.ageOfRecipient ? overrideInfo.ageOfRecipient.boostedTo : 15}% — re-employment at this age is typically treated as unrealistic by courts, making this factor near-determinative.`
              }}
            />
            <SliderComponent
              label="Health of Recipient"
              value={healthOfRecipient}
              onChange={setHealthOfRecipient}
              description="Poor health (low value) → Higher support | Good health → Lower support"
              rationale="Weighted at 9% under normal circumstances because health is significant but courts cannot always verify medical claims without documentation. When health is severely compromised (slider at 9–10), it becomes near-determinative — a recipient who cannot work due to illness or disability is treated similarly to a permanent disability case under A.R.S. § 25-319, and the weight is automatically increased to reflect this."
              warning={{
                threshold: 2,
                direction: "below",
                message: `Weight increased to ${overrideInfo.healthOfRecipient ? overrideInfo.healthOfRecipient.boostedTo : 20}% — severe health limitations are treated as near-determinative. Consult an attorney about whether a long-term or permanent order may apply.`
              }}
            />
            <SliderComponent
              label="Childcare Responsibilities"
              value={childcareResponsibilities}
              onChange={setChildcareResponsibilities}
              description="High childcare responsibilities limiting work → Higher support | Low responsibilities → Lower support"
              rationale="Weighted at 7% because childcare is relevant but partially captured by other factors like earning potential. Its influence grows significantly when the recipient has primary custody of children under school age, since full-time care of young children can make employment practically impossible. At very high values (9–10), the weight is automatically increased to reflect this near-determinative impact."
              warning={{
                threshold: 9,
                message: `Weight increased to ${overrideInfo.childcareResponsibilities ? overrideInfo.childcareResponsibilities.boostedTo : 16}% — primary custody of young children severely limits employment and courts treat this as a major self-sufficiency constraint. Duration may shorten as children reach school age.`
              }}
            />
          </div>

          {/* Marriage Factors */}
          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 mb-6 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Marriage Factors</h3>
            <MarriageSliderComponent
              label="Length of Marriage"
              value={lengthOfMarriage}
              onChange={setLengthOfMarriage}
              description="Longer marriage → Higher support & duration | Shorter marriage → Lower support & duration. Under 5 years significantly reduces duration."
              rationale="Weighted at 20% — the highest weight of any factor — because marriage length is the foundational driver of both the amount and duration of spousal maintenance under Arizona law. It underlies several other factors simultaneously: longer marriages involve more career sacrifice, a higher standard of living expectation, and greater dependency. The 2025 guideline revisions specifically increased the maximum duration for marriages over 16 years, reinforcing how central this factor is."
            />
            <SliderComponent
              label="Standard of Living During Marriage"
              value={standardOfLiving}
              onChange={setStandardOfLiving}
              description="Higher standard of living → Higher support | Lower standard → Lower support"
              rationale="Weighted at 13% because Arizona courts explicitly consider the marital standard of living as the baseline against which support adequacy is measured. In higher-income marriages, courts use it to anchor the award to a lifestyle the recipient reasonably expected to maintain. However, it carries less weight in lower-income marriages where maintaining the exact standard is not realistic for either spouse post-divorce."
            />
            <SliderComponent
              label="Career Sacrifice"
              value={careerSacrifice}
              onChange={setCareerSacrifice}
              description="Significant career sacrifice for the marriage → Higher support | Minimal sacrifice → Lower support"
              rationale="Weighted at 12% because career sacrifice is one of the clearest equitable justifications for spousal maintenance. A.R.S. § 25-319 specifically names a spouse's contribution to the other's educational or career opportunities as a basis for support. Judges look for concrete evidence — years out of the workforce, forgone degrees, geographic relocations, or reduced hours — and treat documented sacrifice as a strong argument for higher awards."
            />
            <SliderComponent
              label="Education/Training Needed"
              value={educationNeeded}
              onChange={setEducationNeeded}
              description="More education or training needed → Higher support amount & longer duration | Little needed → Lower support & shorter duration"
              rationale="Weighted at 8% for the monthly amount, but also directly influences estimated duration — more training needed means a longer runway to self-sufficiency. Courts may award maintenance specifically to fund a degree or vocational program, after which the expectation is self-sufficiency. This is why education needs tend to affect how long support lasts more than how much is paid each month."
            />
          </div>

          {/* Financial Factors */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Factors</h3>
            <SliderComponent
              label="Payor's Ability to Pay"
              value={payorAbilityToPay}
              onChange={setPayorAbilityToPay}
              description="Lower ability to pay → Lower support | Higher ability to pay → Higher support"
              rationale="Weighted at 8% because ability to pay functions more as a ceiling than a linear factor in judicial decisions — a judge will not award more than the payor can reasonably afford regardless of other factors. The relatively modest weight reflects that this constraint typically only becomes decisive when the payor's income is genuinely limited. In higher-income cases it is rarely the determining factor, while in lower-income cases it can cap the award significantly."
            />
            <CurrencyInputComponent
              label="Support Recipient's Total Marital Assets"
              value={recipientAssets}
              onChange={setRecipientAssets}
              helpText="Total value of marital assets awarded to the support recipient."
            />
            <CurrencyInputComponent
              label="Support Payor's Total Marital Assets"
              value={payorAssets}
              onChange={setPayorAssets}
              helpText="Total value of marital assets awarded to the support payor."
            >
              {/* Net offset display + mode toggle */}
              <div className="mt-3 p-2.5 rounded bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                  <span className="text-xs font-semibold text-gray-600">Net Asset Offset:</span>
                  <span className={`text-sm font-bold ${assetsAwarded > 0 ? 'text-orange-600' : assetsAwarded < 0 ? 'text-green-700' : 'text-gray-500'}`}>
                    {assetsAwarded > 0 ? '+' : assetsAwarded < 0 ? '−' : ''} ${Math.abs(assetsAwarded).toLocaleString('en-US')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  = (Recipient ${recipientAssets.toLocaleString('en-US')} − Payor ${payorAssets.toLocaleString('en-US')}) ÷ 2.
                  Each party's fair share is half the total; the offset is the recipient's excess above that.
                </p>
                  {assetsAwarded > 0 && <span className="text-xs text-orange-500 w-full block mb-2">Recipient received more than their equal share → reduces monthly support</span>}
                  {assetsAwarded < 0 && <span className="text-xs text-green-600 w-full block mb-2">Recipient received less than their equal share → increases monthly support</span>}
                  {assetsAwarded === 0 && <span className="text-xs text-gray-400 w-full block mb-2">No offset — assets split equally</span>}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-semibold text-gray-600">Offset method:</span>
                  <button
                    onClick={() => setAssetMode('proportional')}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      assetMode === 'proportional'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    Proportional
                  </button>
                  <button
                    onClick={() => setAssetMode('exact')}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                      assetMode === 'exact'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    Exact subtraction
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  {assetMode === 'proportional'
                    ? "Offset expressed as % of total guideline obligation, used to shift monthly amount within the range."
                    : "Offset subtracted directly from total obligation, then divided by duration to produce revised monthly."}
                </p>
                {assetMode === 'exact' && assetsAwarded !== 0 && exactObligation !== null && (
                  <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded px-2 py-1.5 text-xs text-indigo-700">
                    Adjusted obligation: <span className="font-semibold">${Math.round(exactObligation).toLocaleString('en-US')}</span>
                    {' '}→ revised monthly: <span className="font-semibold">${Math.round(exactMonthly).toLocaleString('en-US')}</span> over <span className="font-semibold">{Math.round(estimatedDuration)} mo</span>
                  </div>
                )}
              </div>
            </CurrencyInputComponent>
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Estimated Spousal Maintenance</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur p-6 rounded-lg">
              <p className="text-blue-100 text-sm font-semibold mb-2">ESTIMATED MONTHLY AMOUNT</p>
              <p className="text-5xl font-bold mb-2">${Math.round(assetMode === 'exact' && exactMonthly !== null ? exactMonthly : estimatedMonthly).toLocaleString('en-US')}</p>
              <p className="text-blue-100 text-xs">
                Range: ${lowAmount.toFixed(0)} - ${highAmount.toFixed(0)}
                {assetMode === 'exact' && exactMonthly !== null && assetsAwarded !== 0 && (
                  <span className="block mt-0.5">Before offset: ${Math.round(estimatedMonthly).toLocaleString('en-US')}</span>
                )}
              </p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur p-6 rounded-lg">
              <p className="text-blue-100 text-sm font-semibold mb-2">ESTIMATED DURATION</p>
              <p className="text-5xl font-bold mb-2">{estimatedDuration.toFixed(0)} mo</p>
              <p className="text-blue-100 text-xs">
                Range: {lowDuration} - {highDuration} months
              </p>
            </div>

            <div className="bg-white bg-opacity-20 backdrop-blur p-6 rounded-lg">
              <p className="text-blue-100 text-sm font-semibold mb-2">TOTAL OBLIGATION</p>
              <p className="text-5xl font-bold mb-2">
                ${Math.round(assetMode === 'exact' && exactObligation !== null ? exactObligation : estimatedMonthly * estimatedDuration).toLocaleString('en-US')}
              </p>
              <p className="text-blue-100 text-xs">
                Total amount over duration
                {assetMode === 'exact' && assetsAwarded !== 0 && exactObligation !== null && (
                  <span className="block mt-0.5">Before offset: ${Math.round(estimatedMonthly * estimatedDuration).toLocaleString('en-US')}</span>
                )}
              </p>
            </div>
          </div>

          {/* Duration Adjustment Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-3">
              <label className="block text-sm font-semibold text-blue-100">Adjust Duration (Maintains Total Obligation)</label>
              <span className="text-lg font-bold text-yellow-300">{(adjustedDuration !== null ? adjustedDuration : estimatedDuration).toFixed(0)} mo</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={sliderDurationMin}
                max={sliderDurationMax}
                value={adjustedDuration !== null ? adjustedDuration : estimatedDuration}
                onChange={(e) => setAdjustedDuration(Number(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer accent-yellow-300"
              />
              {/* Guideline min/max markers */}
              <div className="relative w-full h-5 mt-1">
                {[
                  { val: lowDuration, label: `Guide min: ${lowDuration} mo` },
                  { val: highDuration, label: `Guide max: ${highDuration} mo` },
                ].map(({ val, label }) => {
                  const pct = ((val - sliderDurationMin) / (sliderDurationMax - sliderDurationMin)) * 100;
                  return (
                    <div
                      key={val}
                      className="absolute flex flex-col items-center"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-0.5 h-3 bg-yellow-300 opacity-70" />
                      <span className="text-yellow-200 text-xs whitespace-nowrap mt-0.5" style={{ fontSize: '10px' }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-blue-200 mt-1">
                <span>{sliderDurationMin} mo</span>
                <span>{sliderDurationMax} mo</span>
              </div>
            </div>
            <p className="text-xs text-blue-100 mt-2">
              Adjusted Monthly: <span className="font-semibold text-yellow-200">${adjustedMonthly.toFixed(0)}</span>
              {assetsAwarded !== 0 && (
                <span className="ml-2 opacity-75">(net asset offset of ${assetsAwarded > 0 ? '+' : ''}{assetsAwarded.toLocaleString('en-US')} included)</span>
              )}
              {adjustedDuration !== null && (
                <span className="ml-2">(Base estimate: ${estimatedMonthly.toFixed(0)})</span>
              )}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">Position in Range</p>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-3 overflow-hidden">
              <div
                className="bg-yellow-300 h-full transition-all duration-300"
                style={{ width: `${percentageInRange}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-blue-100 mt-2">
              <span>Low: ${lowAmount}</span>
              <span>High: ${highAmount}</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-sm text-red-800">
          <p className="font-semibold mb-1">⚠️ Important Disclaimer</p>
          <p>
            This tool is an educational estimate only and is NOT legal advice. These calculations are based on general Arizona spousal maintenance guidelines and should not be relied upon for actual divorce proceedings. Consult with a family law attorney in Arizona for accurate legal guidance tailored to your specific situation. Extraordinary circumstances may apply to your case that this tool cannot account for.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;