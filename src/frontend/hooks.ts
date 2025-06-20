import { useEffect, useState } from "react";

export const useConfig = <T>(key: string, defaultValue: T = null) => {
    const [value, setValue] = useState<T>(() => {
        return defaultValue;
    });
    const [loaded, setLoaded] = useState(false);
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
}