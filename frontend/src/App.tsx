import {useState} from 'react'
import {AnalyticsDashboard} from './features/analytics/AnalyticsDashboard'
import type {AnalyticsSection} from './shared/types/analytics'
import './App.css'

function App() {
    const [activeSection, setActiveSection] =
        useState<AnalyticsSection>('activity')

    return (
        <AnalyticsDashboard
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        />
    )
}

export default App
