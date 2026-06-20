import React, { useState, useMemo } from 'react';
import './App.css';

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
  const [ageOfRecipient, setAgeOfRecipient] = useState(46); // Age slider: 18-75
  const [healthOfRecipient, setHealthOfRecipient] = useState(5);
  const [educationNeeded, setEducationNeeded] = useState(5);
  const [childcareResponsibilities, setChildcareResponsibilities] = useState(5);

  // Marriage factors
  const [lengthOfMarriage, setLengthOfMarriage] = useState(1); // Marriage length: 1-40 years
  const [careerSacrifice, setCareerSacrifice] = useState(5);

  // Financial factors
  const [assetsAwarded, setAssetsAwarded] = useState(0); // Currency value in dollars
  const [payorAbilityToPay, setPayorAbilityToPay] = useState(5);

  // Duration adjustment slider - allows user to shift duration/amount while keeping obligation constant
  const [adjustedDuration, setAdjustedDuration] = useState(null);

  // Weights for each factor - lengthOfMarriage increased to 0.20 for legal significance
  const weights = {
    recipientEarning: 0.12,
    standardOfLiving: 0.11,
    lengthOfMarriage: 0.20,      // Significantly increased weight for legal thresholds
    ageOfRecipient: 0.08,
    healthOfRecipient: 0.08,
    careerSacrifice: 0.11,
    educationNeeded: 0.07,
    assetsAwarded: 0.08,
    payorAbilityToPay: 0.07,
    childcareResponsibilities: 0.08,
  };

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

  // Calculate the weighted adjustment factor (sliders only, excluding asset offset)
  const adjustmentFactor = useMemo(() => {
    // Convert slider values (1-10) to adjustment factors (-1 to 1)
    // For factors where higher values = higher support, we normalize as: (value - 5.5) / 4.5
    // For factors where higher values = lower support, we invert: (5.5 - value) / 4.5
    
    const factors = {
      recipientEarning: (5.5 - recipientEarning) / 4.5,    // Low earning = higher support
      standardOfLiving: (standardOfLiving - 5.5) / 4.5,    // High std = higher support
      lengthOfMarriage: getMarriageLengthFactor(lengthOfMarriage),  // Weighted by legal thresholds
      ageOfRecipient: (ageOfRecipient - 46.5) / 28.5,      // Older = higher support (age 18-75, midpoint 46.5)
      healthOfRecipient: (healthOfRecipient - 5.5) / 4.5,  // Poor health = higher support
      careerSacrifice: (careerSacrifice - 5.5) / 4.5,      // Career sacrifice = higher support
      educationNeeded: (educationNeeded - 5.5) / 4.5,      // More education = higher support
      payorAbilityToPay: (5.5 - payorAbilityToPay) / 4.5,  // Lower ability = lower support
      childcareResponsibilities: (childcareResponsibilities - 5.5) / 4.5,  // More responsibilities = higher support
      // Note: assetAwarded is applied separately as an independent adjustment
    };

    let weightedFactor = 0;
    for (const [key, value] of Object.entries(factors)) {
      weightedFactor += value * weights[key];
    }

    return Math.max(-1, Math.min(1, weightedFactor));
  }, [
    recipientEarning, standardOfLiving, lengthOfMarriage, ageOfRecipient,
    healthOfRecipient, careerSacrifice, educationNeeded,
    payorAbilityToPay, childcareResponsibilities
  ]);

  // Calculate estimated monthly amount with separate asset offset adjustment
  const estimatedMonthly = useMemo(() => {
    // Step 1: Use the adjustment factor (from sliders) to interpolate between low and high
    const range = highAmount - lowAmount;
    const adjustment = (adjustmentFactor * range) / 2;
    let estimate = midAmount + adjustment;
    
    // Clamp slider estimate to range
    estimate = Math.max(lowAmount, Math.min(highAmount, estimate));
    
    // Step 2: Apply asset offset as a separate, independent adjustment
    const midpointDuration = (lowDuration + highDuration) / 2;
    const totalObligation = midAmount * midpointDuration;
    
    // Calculate offset percentage (capped at 100% in either direction)
    const offsetPercentage = Math.max(-1, Math.min(1, assetsAwarded / totalObligation));
    
    // Apply asset offset adjustment
    if (offsetPercentage > 0) {
      // Positive offset (recipient got more assets) -> push toward LOW end
      const adjustmentAmount = offsetPercentage * (estimate - lowAmount);
      estimate -= adjustmentAmount;
    } else if (offsetPercentage < 0) {
      // Negative offset (recipient got fewer assets) -> push toward HIGH end
      const adjustmentAmount = Math.abs(offsetPercentage) * (highAmount - estimate);
      estimate += adjustmentAmount;
    }
    
    // Final clamp to ensure we stay within bounds
    return Math.max(lowAmount, Math.min(highAmount, estimate));
  }, [adjustmentFactor, lowAmount, midAmount, highAmount, assetsAwarded, lowDuration, highDuration]);

  // Calculate estimated duration
  const estimatedDuration = useMemo(() => {
    // Factors that extend duration: longer marriage, older age, poor health, low payor ability
    // Marriage length uses weighted factor reflecting legal thresholds
    const durationFactors = {
      marriage: getMarriageLengthFactor(lengthOfMarriage),
      age: (ageOfRecipient - 46.5) / 28.5,
      health: (healthOfRecipient - 5.5) / 4.5,
      payorAbility: (5.5 - payorAbilityToPay) / 4.5,
    };

    const weightedDuration = (durationFactors.marriage * 0.5 + 
                             durationFactors.age * 0.25 + 
                             durationFactors.health * 0.15 + 
                             durationFactors.payorAbility * 0.1);

    const durationRange = highDuration - lowDuration;
    const adjustment = (weightedDuration * durationRange) / 2;
    const estimate = lowDuration + (durationRange / 2) + adjustment;

    return Math.max(lowDuration, Math.min(highDuration, estimate));
  }, [lengthOfMarriage, ageOfRecipient, healthOfRecipient, payorAbilityToPay, lowDuration, highDuration]);

  // Calculate percentage within range for the visual bar
  const percentageInRange = ((estimatedMonthly - lowAmount) / (highAmount - lowAmount)) * 100;

  // Calculate adjusted monthly amount based on duration slider (keeps total obligation constant)
  const adjustedMonthly = useMemo(() => {
    if (adjustedDuration === null) return estimatedMonthly;
    
    const totalObligation = estimatedMonthly.toFixed(0) * estimatedDuration.toFixed(0);
    return totalObligation / adjustedDuration;
  }, [estimatedMonthly, estimatedDuration, adjustedDuration]);

  const SliderComponent = ({ label, value, onChange, description }) => (
    <div className="mb-4">
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
    </div>
  );

  const AgeSliderComponent = ({ label, value, onChange, description }) => {
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
          <span className="text-lg font-bold text-blue-600">{value} {value === 18 ? 'years or younger' : value === 75 ? 'years or older' : 'years old'}</span>
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
          {/* Tick marks for significant ages */}
          <div className="relative -top-1 h-1 w-full">
            {markers.map((marker) => (
              <div
                key={marker.age}
                className="absolute w-1 h-3 bg-gray-400 transform -translate-x-1/2"
                style={{ left: `${marker.percent}%` }}
              />
            ))}
          </div>
          {/* Labels for significant ages */}
          <div className="relative h-5 w-full">
            {markers.map((marker) => (
              <div
                key={`label-${marker.age}`}
                className="absolute text-xs text-gray-600 transform -translate-x-1/2 mt-1"
                style={{ left: `${marker.percent}%` }}
              >
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
      </div>
    );
  };

  const MarriageSliderComponent = ({ label, value, onChange, description }) => {
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
          <span className="text-lg font-bold text-blue-600">{value} {value === 1 ? 'year' : value === 40 ? 'years or longer' : 'years'}</span>
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
          {/* Tick marks for significant marriage lengths */}
          <div className="relative -top-1 h-1 w-full">
            {markers.map((marker) => (
              <div
                key={marker.years}
                className="absolute w-1 h-3 bg-gray-400 transform -translate-x-1/2"
                style={{ left: `${marker.percent}%` }}
              />
            ))}
          </div>
          {/* Labels for significant marriage lengths */}
          <div className="relative h-5 w-full">
            {markers.map((marker) => (
              <div
                key={`label-${marker.years}`}
                className="absolute text-xs text-gray-600 transform -translate-x-1/2 mt-1"
                style={{ left: `${marker.percent}%` }}
              >
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
      </div>
    );
  };

  const CurrencyInputComponent = ({ label, value, onChange, description, helpText }) => {
    const inputRef = React.useRef(null);
    const [displayValue, setDisplayValue] = React.useState(String(value || ''));

    const formatCurrency = (num) => {
      if (!num) return '';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(num);
    };

    const handleChange = (e) => {
      const input = e.target.value;
      // Keep raw input for immediate display while typing
      setDisplayValue(input);
    };

    const handleBlur = (e) => {
      const input = e.target.value;
      // Remove currency formatting and parse on blur
      const numValue = parseInt(input.replace(/[^0-9-]/g, ''), 10);
      const finalValue = isNaN(numValue) ? 0 : numValue;
      onChange(finalValue);
      setDisplayValue(formatCurrency(finalValue).replace('$', ''));
    };

    const handleFocus = () => {
      // When focused, show the raw value without formatting
      setDisplayValue(value ? String(value) : '');
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
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder="0"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-2">
          {helpText && <p className="text-xs text-gray-600">{helpText}</p>}
          {description && <p className="text-xs text-gray-600 mt-1">{description}</p>}
        </div>
      </div>
    );
  };

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

          {/* Recipient Factors */}
          <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-6 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recipient Factors</h3>
            <SliderComponent
              label="Earning Potential of Recipient"
              value={recipientEarning}
              onChange={setRecipientEarning}
              description="Low earning potential → Higher support | High earning potential → Lower support"
            />
            <AgeSliderComponent
              label="Age of Recipient"
              value={ageOfRecipient}
              onChange={setAgeOfRecipient}
              description="Older age (harder to re-enter workforce) → Higher support | Younger age → Lower support"
            />
            <SliderComponent
              label="Health of Recipient"
              value={healthOfRecipient}
              onChange={setHealthOfRecipient}
              description="Poor health → Higher support | Good health → Lower support"
            />
            <SliderComponent
              label="Childcare Responsibilities"
              value={childcareResponsibilities}
              onChange={setChildcareResponsibilities}
              description="High childcare (limiting work) → Higher support | Low childcare → Lower support"
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
            />
            <SliderComponent
              label="Standard of Living During Marriage"
              value={standardOfLiving}
              onChange={setStandardOfLiving}
              description="Higher standard of living → Higher support | Lower standard → Lower support"
            />
            <SliderComponent
              label="Career Sacrifice"
              value={careerSacrifice}
              onChange={setCareerSacrifice}
              description="Significant career sacrifice → Higher support | Minimal sacrifice → Lower support"
            />
            <SliderComponent
              label="Education/Training Needed"
              value={educationNeeded}
              onChange={setEducationNeeded}
              description="More education needed → Higher support | Little needed → Lower support"
            />
          </div>

          {/* Financial Factors */}
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Factors</h3>
            <SliderComponent
              label="Payor's Ability to Pay"
              value={payorAbilityToPay}
              onChange={setPayorAbilityToPay}
              description="Lower ability to pay → Lower support | Higher ability → Higher support"
            />
            <CurrencyInputComponent
              label="Net Asset Offset"
              value={assetsAwarded}
              onChange={setAssetsAwarded}
              helpText="Enter a positive number if the recipient received more assets than the payor, negative if they received fewer"
              description="The total guideline obligation is calculated based on the midpoint monthly amount and duration. This asset offset is expressed as a percentage of that obligation (capped at ±100%) and adjusts the estimated support accordingly."
            />
          </div>
        </div>

        {/* Output Section */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-6">Estimated Spousal Maintenance</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-white bg-opacity-20 backdrop-blur p-6 rounded-lg">
              <p className="text-blue-100 text-sm font-semibold mb-2">ESTIMATED MONTHLY AMOUNT</p>
              <p className="text-5xl font-bold mb-2">${estimatedMonthly.toFixed(0)}</p>
              <p className="text-blue-100 text-xs">
                Range: ${lowAmount.toFixed(0)} - ${highAmount.toFixed(0)}
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
              <p className="text-5xl font-bold mb-2">${Math.round(estimatedMonthly.toFixed(0) * estimatedDuration.toFixed(0)).toLocaleString('en-US')}</p>
              <p className="text-blue-100 text-xs">
                Total amount over duration
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
                min={lowDuration}
                max={highDuration}
                value={adjustedDuration !== null ? adjustedDuration : estimatedDuration}
                onChange={(e) => setAdjustedDuration(Number(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer accent-yellow-300"
              />
              <div className="flex justify-between text-xs text-blue-100 mt-2">
                <span>{lowDuration} mo</span>
                <span>{highDuration} mo</span>
              </div>
            </div>
            <p className="text-xs text-blue-100 mt-2">
              Adjusted Monthly: <span className="font-semibold">${adjustedMonthly.toFixed(0)}</span> 
              {adjustedDuration !== null && adjustedMonthly !== estimatedMonthly && 
                <span className="ml-2">(Estimated: ${estimatedMonthly.toFixed(0)})</span>
              }
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
