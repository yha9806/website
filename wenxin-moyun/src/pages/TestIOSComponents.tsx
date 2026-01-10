import React, { useState } from 'react';
import { 
  IOSButton, 
  IOSCard, 
  IOSCardHeader, 
  IOSCardContent, 
  IOSCardFooter,
  IOSCardGrid,
  EmojiIcon,
  StatusEmoji,
  RankEmoji,
  TypeEmoji,
  IOSToggle,
  IOSSlider,
  IOSAlert,
  IOSFilterPanel
} from '../components/ios';
import type { 
  IOSFilterConfig,
  IOSFilterValues 
} from '../components/ios/core/IOSFilterPanel';

export default function TestIOSComponents() {
  const [toggleValue, setToggleValue] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [showAlert, setShowAlert] = useState(false);

  // Filter Panel test state
  const [filterValues, setFilterValues] = useState<IOSFilterValues>({
    search: '',
    organizations: [],
    tags: [],
    categories: [],
    scoreRange: [0, 100] as [number, number],
    winRateRange: [0, 100] as [number, number],
    dateRange: 'all',
    weights: [
      { name: 'Creativity', key: 'creativity', value: 25, color: '#FF6B6B' },
      { name: 'Quality', key: 'quality', value: 25, color: '#4ECDC4' },
      { name: 'Innovation', key: 'innovation', value: 25, color: '#45B7D1' },
      { name: 'Impact', key: 'impact', value: 25, color: '#96CEB4' }
    ]
  });

  const filterConfig: IOSFilterConfig = {
    organizations: ['OpenAI', 'Google', 'Anthropic', 'Meta', 'Baidu', 'Alibaba', 'Tencent', 'ByteDance'],
    tags: ['Creative', 'Efficient', 'Innovative', 'Popular', 'New', 'Trending', 'Featured', 'Premium'],
    categories: [
      { id: 'text', label: 'Text Generation', emoji: '📝' },
      { id: 'visual', label: 'Visual Creation', emoji: '🎨' },
      { id: 'multimodal', label: 'Multimodal', emoji: '🔀' },
      { id: 'code', label: 'Code Generation', emoji: '💻' }
    ],
    dateOptions: [
      { value: 'all', label: 'All Time' },
      { value: '7d', label: 'Last 7 Days' },
      { value: '30d', label: 'Last 30 Days' },
      { value: '90d', label: 'Last 3 Months' },
      { value: '365d', label: 'Last Year' }
    ],
    weights: [
      { name: 'Creativity', key: 'creativity', value: 25, color: '#FF6B6B', description: 'Innovation and originality' },
      { name: 'Quality', key: 'quality', value: 25, color: '#4ECDC4', description: 'Technical excellence' },
      { name: 'Innovation', key: 'innovation', value: 25, color: '#45B7D1', description: 'Breakthrough features' },
      { name: 'Impact', key: 'impact', value: 25, color: '#96CEB4', description: 'Real-world influence' }
    ]
  };

  return (
    <div className="space-y-8 p-4">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">iOS Component Test Page</h1>
        <p className="text-gray-600 dark:text-gray-400">Testing new iOS design system components</p>
      </div>

      {/* Emoji Icons Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Emoji Icons</h2>
        <IOSCard variant="glass" padding="lg">
          <IOSCardHeader 
            title="Status Emojis" 
            subtitle="Different status indicators"
            emoji={<EmojiIcon category="feedback" name="info" size="lg" />}
          />
          <IOSCardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <StatusEmoji status="pending" size="lg" />
                <p className="text-sm mt-1">Pending</p>
              </div>
              <div className="text-center">
                <StatusEmoji status="processing" size="lg" />
                <p className="text-sm mt-1">Processing</p>
              </div>
              <div className="text-center">
                <StatusEmoji status="completed" size="lg" />
                <p className="text-sm mt-1">Completed</p>
              </div>
              <div className="text-center">
                <StatusEmoji status="failed" size="lg" />
                <p className="text-sm mt-1">Failed</p>
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </section>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Buttons</h2>
        <div className="space-y-4">
          {/* Primary Buttons */}
          <IOSCard>
            <IOSCardHeader title="Primary Buttons" />
            <IOSCardContent>
              <div className="flex flex-wrap gap-3">
                <IOSButton variant="primary" size="sm">Small</IOSButton>
                <IOSButton variant="primary" size="md">Medium</IOSButton>
                <IOSButton variant="primary" size="lg">Large</IOSButton>
                <IOSButton variant="primary" emoji="like">With Emoji</IOSButton>
                <IOSButton variant="primary" disabled>Disabled</IOSButton>
              </div>
            </IOSCardContent>
          </IOSCard>

          {/* Secondary Buttons */}
          <IOSCard>
            <IOSCardHeader title="Secondary Buttons" />
            <IOSCardContent>
              <div className="flex flex-wrap gap-3">
                <IOSButton variant="secondary">Secondary</IOSButton>
                <IOSButton variant="secondary" emoji="share">Share</IOSButton>
                <IOSButton variant="secondary" disabled>Disabled</IOSButton>
              </div>
            </IOSCardContent>
          </IOSCard>

          {/* Destructive Buttons */}
          <IOSCard>
            <IOSCardHeader title="Destructive Buttons" />
            <IOSCardContent>
              <div className="flex flex-wrap gap-3">
                <IOSButton variant="destructive">Delete</IOSButton>
                <IOSButton variant="destructive" emoji="delete">Remove</IOSButton>
                <IOSButton variant="destructive" disabled>Disabled</IOSButton>
              </div>
            </IOSCardContent>
          </IOSCard>

          {/* Glass Buttons */}
          <IOSCard variant="glass">
            <IOSCardHeader title="Glass Morphism Buttons" />
            <IOSCardContent>
              <div className="flex flex-wrap gap-3">
                <IOSButton variant="glass">Glass Button</IOSButton>
                <IOSButton variant="glass" glassMorphism>Enhanced Glass</IOSButton>
                <IOSButton variant="glass" emoji="favorite">Favorite</IOSButton>
              </div>
            </IOSCardContent>
          </IOSCard>
        </div>
      </section>

      {/* Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Cards</h2>
        <IOSCardGrid columns={3} gap="md">
          {/* Flat Card */}
          <IOSCard variant="flat">
            <IOSCardHeader 
              title="Flat Card" 
              emoji={<TypeEmoji type="poem" size="lg" />}
            />
            <IOSCardContent>
              <p>This is a flat card with minimal shadow.</p>
            </IOSCardContent>
            <IOSCardFooter>
              <IOSButton variant="text" size="sm">Learn More</IOSButton>
            </IOSCardFooter>
          </IOSCard>

          {/* Elevated Card */}
          <IOSCard variant="elevated" interactive onClick={() => console.log('Clicked!')}>
            <IOSCardHeader 
              title="Elevated Card" 
              subtitle="Click me!"
              emoji={<TypeEmoji type="painting" size="lg" />}
            />
            <IOSCardContent>
              <p>This card has elevation and is interactive.</p>
            </IOSCardContent>
            <IOSCardFooter>
              <div className="flex justify-between items-center">
                <RankEmoji rank={1} size="md" />
                <IOSButton variant="primary" size="sm">Action</IOSButton>
              </div>
            </IOSCardFooter>
          </IOSCard>

          {/* Glass Card */}
          <IOSCard variant="glass">
            <IOSCardHeader 
              title="Glass Card" 
              emoji={<TypeEmoji type="music" size="lg" />}
            />
            <IOSCardContent>
              <p>Beautiful glass morphism effect with backdrop blur.</p>
            </IOSCardContent>
            <IOSCardFooter divider={false}>
              <div className="flex gap-2">
                <IOSButton variant="glass" size="sm">Option 1</IOSButton>
                <IOSButton variant="glass" size="sm">Option 2</IOSButton>
              </div>
            </IOSCardFooter>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Evaluation Card Example */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Example: Evaluation Card</h2>
        <IOSCardGrid columns={2} gap="lg">
          <IOSCard variant="elevated" interactive>
            <IOSCardHeader 
              title="Poetry Evaluation" 
              subtitle="Model: GPT-4"
              emoji={<TypeEmoji type="poem" size="lg" />}
              action={<StatusEmoji status="processing" animated />}
            />
            <IOSCardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '45%' }} />
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <div className="text-center">
                    <EmojiIcon category="rating" name="star" size="md" />
                    <p className="text-xs mt-1">Quality</p>
                  </div>
                  <div className="text-center">
                    <EmojiIcon category="trend" name="up" size="md" animated animationType="pulse" />
                    <p className="text-xs mt-1">Trending</p>
                  </div>
                  <div className="text-center">
                    <EmojiIcon category="feedback" name="celebration" size="md" />
                    <p className="text-xs mt-1">Top Rated</p>
                  </div>
                </div>
              </div>
            </IOSCardContent>
            <IOSCardFooter>
              <div className="flex gap-2">
                <IOSButton variant="primary" size="sm" emoji="like">Like</IOSButton>
                <IOSButton variant="secondary" size="sm" emoji="share">Share</IOSButton>
                <IOSButton variant="text" size="sm">Details</IOSButton>
              </div>
            </IOSCardFooter>
          </IOSCard>

          <IOSCard variant="elevated" interactive>
            <IOSCardHeader 
              title="Art Generation" 
              subtitle="Model: DALL-E 3"
              emoji={<TypeEmoji type="painting" size="lg" />}
              action={<StatusEmoji status="completed" animated />}
            />
            <IOSCardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Score</span>
                  <span className="font-medium text-green-600">92/100</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold">4.8</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <p className="text-lg font-bold">1.2k</p>
                    <p className="text-xs text-gray-500">Views</p>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <RankEmoji rank={2} size="sm" />
                    <p className="text-xs text-gray-500 mt-1">Rank</p>
                  </div>
                </div>
              </div>
            </IOSCardContent>
            <IOSCardFooter>
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <EmojiIcon key={i} category="rating" name="star" size="sm" />
                  ))}
                </div>
                <IOSButton variant="primary" size="sm">View Result</IOSButton>
              </div>
            </IOSCardFooter>
          </IOSCard>
        </IOSCardGrid>
      </section>

      {/* Toggle Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Toggles</h2>
        <IOSCard variant="elevated" padding="lg">
          <IOSCardHeader title="Toggle Controls" subtitle="iOS-style switches" />
          <IOSCardContent>
            <div className="space-y-6">
              <IOSToggle
                checked={toggleValue}
                onChange={setToggleValue}
                label="Enable Notifications"
                description="Receive push notifications for new updates"
              />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm mb-2">Small</p>
                  <IOSToggle
                    checked={toggleValue}
                    onChange={setToggleValue}
                    size="sm"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm mb-2">Medium</p>
                  <IOSToggle
                    checked={toggleValue}
                    onChange={setToggleValue}
                    size="md"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm mb-2">Large</p>
                  <IOSToggle
                    checked={toggleValue}
                    onChange={setToggleValue}
                    size="lg"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm mb-2">Disabled</p>
                  <IOSToggle
                    checked={false}
                    onChange={() => {}}
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <IOSToggle
                  checked={true}
                  onChange={() => {}}
                  color="primary"
                  label="Primary"
                />
                <IOSToggle
                  checked={true}
                  onChange={() => {}}
                  color="green"
                  label="Success"
                />
                <IOSToggle
                  checked={true}
                  onChange={() => {}}
                  color="orange"
                  label="Warning"
                />
                <IOSToggle
                  checked={true}
                  onChange={() => {}}
                  color="red"
                  label="Danger"
                />
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </section>

      {/* Slider Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Sliders</h2>
        <IOSCard variant="elevated" padding="lg">
          <IOSCardHeader title="Slider Controls" subtitle="Interactive value sliders" />
          <IOSCardContent>
            <div className="space-y-8">
              <IOSSlider
                value={sliderValue}
                onChange={setSliderValue}
                label="Volume Level"
                showValue
                formatValue={(v) => `${v}%`}
              />
              
              <IOSSlider
                value={25}
                onChange={() => {}}
                min={0}
                max={100}
                step={25}
                color="green"
                label="Battery Level"
                formatValue={(v) => `${v}%`}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <IOSSlider
                  value={30}
                  onChange={() => {}}
                  size="sm"
                  color="primary"
                  label="Small"
                />
                <IOSSlider
                  value={60}
                  onChange={() => {}}
                  size="md"
                  color="orange"
                  label="Medium"
                />
                <IOSSlider
                  value={90}
                  onChange={() => {}}
                  size="lg"
                  color="red"
                  label="Large"
                />
              </div>

              <IOSSlider
                value={50}
                onChange={() => {}}
                disabled
                label="Disabled Slider"
              />
            </div>
          </IOSCardContent>
        </IOSCard>
      </section>

      {/* Alert Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Alerts</h2>
        <IOSCard variant="elevated" padding="lg">
          <IOSCardHeader title="Alert Dialogs" subtitle="iOS-style modal alerts" />
          <IOSCardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <IOSButton
                variant="primary"
                onClick={() => setShowAlert(true)}
              >
                Show Alert
              </IOSButton>
              
              <IOSButton
                variant="secondary"
                onClick={() => alert('Success alert would show')}
              >
                Success
              </IOSButton>
              
              <IOSButton
                variant="glass"
                onClick={() => alert('Warning alert would show')}
              >
                Warning
              </IOSButton>
              
              <IOSButton
                variant="destructive"
                onClick={() => alert('Error alert would show')}
              >
                Error
              </IOSButton>
            </div>
          </IOSCardContent>
        </IOSCard>

        {/* Demo Alert */}
        <IOSAlert
          visible={showAlert}
          onClose={() => setShowAlert(false)}
          type="info"
          title="Welcome to iOS Components! 🎉"
          message="This is a demo of the new iOS-style alert component with native-like animations and styling."
          actions={[
            {
              label: "Cancel",
              onPress: () => setShowAlert(false),
              style: "cancel"
            },
            {
              label: "Got it!",
              onPress: () => setShowAlert(false),
              style: "default"
            }
          ]}
        />
      </section>

      {/* Filter Panel Components */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">iOS Filter Panel</h2>
        <IOSCard variant="elevated" padding="lg">
          <IOSCardHeader 
            title="Advanced Filter System" 
            subtitle="Unified filtering with iOS design" 
            emoji={<EmojiIcon category="actions" name="filter" size="md" />}
          />
          <IOSCardContent>
            <div className="space-y-6">
              {/* Basic Filter Panel */}
              <div>
                <h3 className="text-lg font-medium mb-3">Basic Filter Panel</h3>
                <div className="flex items-center justify-between mb-4">
                  <IOSFilterPanel
                    config={filterConfig}
                    values={filterValues}
                    onChange={setFilterValues}
                    showAdvanced={false}
                    showWeights={false}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Simple filtering interface
                  </span>
                </div>
              </div>

              {/* Advanced Filter Panel */}
              <div>
                <h3 className="text-lg font-medium mb-3">Advanced Filter Panel</h3>
                <div className="flex items-center justify-between mb-4">
                  <IOSFilterPanel
                    config={filterConfig}
                    values={filterValues}
                    onChange={setFilterValues}
                    showAdvanced={true}
                    showWeights={false}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    With range sliders and advanced options
                  </span>
                </div>
              </div>

              {/* Full Feature Filter Panel */}
              <div>
                <h3 className="text-lg font-medium mb-3">Full Feature Filter Panel</h3>
                <div className="flex items-center justify-between mb-4">
                  <IOSFilterPanel
                    config={filterConfig}
                    values={filterValues}
                    onChange={setFilterValues}
                    showAdvanced={true}
                    showWeights={true}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Complete filtering with weight adjustment
                  </span>
                </div>
              </div>

              {/* Filter State Display */}
              <div className="mt-6 p-4 ios-glass rounded-lg">
                <h4 className="text-md font-medium mb-3">Current Filter State</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong>Search:</strong> {filterValues.search || '(none)'}
                    </div>
                    <div>
                      <strong>Date Range:</strong> {filterValues.dateRange}
                    </div>
                    <div>
                      <strong>Organizations:</strong> {filterValues.organizations.length > 0 ? filterValues.organizations.join(', ') : '(none)'}
                    </div>
                    <div>
                      <strong>Categories:</strong> {filterValues.categories.length > 0 ? filterValues.categories.join(', ') : '(none)'}
                    </div>
                    <div>
                      <strong>Score Range:</strong> {filterValues.scoreRange[0]} - {filterValues.scoreRange[1]}
                    </div>
                    <div>
                      <strong>Win Rate Range:</strong> {filterValues.winRateRange[0]}% - {filterValues.winRateRange[1]}%
                    </div>
                  </div>
                  
                  {filterValues.tags.length > 0 && (
                    <div className="mt-3">
                      <strong>Tags:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filterValues.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {filterValues.weights && (
                    <div className="mt-3">
                      <strong>Weight Distribution:</strong>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {filterValues.weights.map(weight => (
                          <div key={weight.key} className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: weight.color }}
                            />
                            <span className="text-xs">
                              {weight.name}: {weight.value.toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </IOSCardContent>
        </IOSCard>
      </section>
    </div>
  );
}