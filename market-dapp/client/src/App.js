import React from 'react';
import { DrizzleContext } from "@drizzle/react-plugin";
import { Drizzle } from "@drizzle/store";
import STMarketplace from "./STMarketplace.json";
import RouterPage from "./pages/RouterPage";

const drizzleOptions = {
  contracts: [STMarketplace]
};

const drizzle = new Drizzle(drizzleOptions);

class App extends React.Component {

  render() {
    return (
      <DrizzleContext.Provider drizzle={drizzle}>
        <DrizzleContext.Consumer>
          {drizzleContext => {
            const { drizzle, drizzleState, initialized } = drizzleContext;

            if (!initialized) {
              return "Loading..."
            }

            return (
              <RouterPage drizzle={drizzle} drizzleState={drizzleState} />
            )
          }}
        </DrizzleContext.Consumer>
      </DrizzleContext.Provider>
    );
  }

}

export default App;
