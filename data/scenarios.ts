import { SimulationScenarioMatrix } from "../types";

export const SCENARIO_DB: SimulationScenarioMatrix[] = [
    {
      id: 'SCN-ALPHA-01',
      designation: 'HOSTILE TAKEOVER DEFENSE',
      difficultyLevel: 'HOSTILE_TAKEOVER',
      targetRhetoricPattern: "We categorically reject the valuation as it fails to account for our proprietary IP pipeline.",
      probabilityManifolds: [
        {
          triggerCondition: "(reject|no|never)",
          syntheticResponse: "Your rejection is noted, but the market cap suggests you have no leverage. Explain your liquidity position.",
          outcomeYield: 0.8
        },
        {
          triggerCondition: "(agree|yes|okay)",
          syntheticResponse: "Submission detected. We are lowering the offer by 15% due to your lack of conviction.",
          outcomeYield: 0.2
        },
        {
          triggerCondition: "(pipeline|ip|tech)",
          syntheticResponse: "The pipeline is speculative. Give me concrete revenue figures for Q3.",
          outcomeYield: 0.6
        }
      ]
    },
    {
      id: 'SCN-BETA-04',
      designation: 'EXECUTIVE SALARY ARBITRAGE',
      difficultyLevel: 'HIGH_YIELD',
      targetRhetoricPattern: "My performance metrics justify a base adjustment of twenty percent plus equity refresh.",
      probabilityManifolds: [
        {
          triggerCondition: "(percent|equity|stock)",
          syntheticResponse: "Equity is reserved for critical talent. Prove you are indispensable.",
          outcomeYield: 0.7
        },
        {
          triggerCondition: "(quit|leave|offer)",
          syntheticResponse: "Is that a threat? The door is open. We have three candidates ready.",
          outcomeYield: 0.1
        }
      ]
    },
    {
      id: 'SCN-GAMMA-09',
      designation: 'SUPPLY CHAIN DEADLOCK',
      difficultyLevel: 'LOW_YIELD',
      targetRhetoricPattern: "We need to align on a delivery schedule that mitigates our inventory risk.",
      probabilityManifolds: [
        {
          triggerCondition: "(risk|inventory|schedule)",
          syntheticResponse: "We can prioritize your shipment if you agree to a 10% premium.",
          outcomeYield: 0.5
        }
      ]
    }
  ];