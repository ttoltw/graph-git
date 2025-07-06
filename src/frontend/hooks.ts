import { useEffect, useState, SetStateAction } from "react";

export const useConfig = <T>(key: string, defaultValue: T = null) => {
  const [value, setStateValue] = useState<T>(() => {
    return defaultValue;
  });
  const [loaded, setLoaded] = useState(false);
  const setValue = async (state: SetStateAction<T>) => {
    let newValue: T;
    if (typeof state === "function") {
      newValue = (state as (prev: T) => T)(value);
    } else {
      newValue = state;
    }
    setStateValue(newValue);
    await bridge.config.set(key, state);
  };
  useEffect(() => {
    console.log(`[useConfig] Loading config for key: ${key}`);
    bridge.config.get().then((config) => {
      console.log(`[useConfig] Config loaded: ${JSON.stringify(config)}`);
      setLoaded(true);
      if (config && key in config) {
        setValue(config[key] as T);
      }
    });
  }, [key]);
  useEffect(() => {
    if (!loaded) return;
    console.log(`[useConfig] Setting config for key: ${key}, value: ${value}`);
    bridge.config.set(key, value);
  }, [key, value, loaded]);

  return [value, setValue] as const;
};
