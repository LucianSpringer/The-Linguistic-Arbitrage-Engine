import { SimulationScenarioMatrix } from "../types";
import { SCENARIO_DB } from "../data/scenarios";

/**
 * Service responsible for injecting static scenarios and managing
 * fallback simulation logic when the Neural Link is severed.
 */
export class ScenarioInjectionModule {
  private static instance: ScenarioInjectionModule;
  private scenarioRegistry: SimulationScenarioMatrix[];

  private constructor() {
    // Simulate Data Loading from JSON Source
    this.scenarioRegistry = SCENARIO_DB;
  }

  public static getInstance(): ScenarioInjectionModule {
    if (!ScenarioInjectionModule.instance) {
      ScenarioInjectionModule.instance = new ScenarioInjectionModule();
    }
    return ScenarioInjectionModule.instance;
  }

  public retrieveScenarioLibrary(): SimulationScenarioMatrix[] {
    return this.scenarioRegistry;
  }

  public getScenarioById(id: string): SimulationScenarioMatrix | undefined {
    return this.scenarioRegistry.find(s => s.id === id);
  }

  /**
   * Simulates an AI response based on Regex matching of probability manifolds.
   * Used when the Live API is offline (Circuit Breaker / Simulation Mode).
   */
  public processOfflineSimulation(scenarioId: string, userPayload: string): string {
    const scenario = this.getScenarioById(scenarioId);
    
    // Audit Log Entry
    console.log(`[SIMULATION_ENGINE] Processing Trigger | Scenario: ${scenarioId} | Payload: "${userPayload}"`);

    if (!scenario) {
      console.error(`[SIMULATION_ERROR] Scenario ID ${scenarioId} not found in registry.`);
      return "ERROR: SCENARIO_DATA_CORRUPTION";
    }

    const lowerPayload = userPayload.toLowerCase();
    
    // Find matching manifold
    const matchedManifold = scenario.probabilityManifolds.find(manifold => {
      const regex = new RegExp(manifold.triggerCondition);
      return regex.test(lowerPayload);
    });

    if (matchedManifold) {
      console.log(`[SIMULATION_HIT] Manifold Activated: ${matchedManifold.triggerCondition} | Yield: ${matchedManifold.outcomeYield}`);
      return `[SIMULATION_MODE]: ${matchedManifold.syntheticResponse}`;
    }

    console.log(`[SIMULATION_MISS] No manifold triggered. Defaulting to fallback response.`);
    return "[SIMULATION_MODE]: I am not compelled by that argument. Please restructure your leverage.";
  }
}
