import {useRef, useEffect} from 'react';

export const useSetInterval = (cb, time, play) => {
    const cbRef = useRef(null);
    useEffect(() => {
        cbRef.current = cb
    })
    useEffect(() => {
        if (play) {
            const interval = setInterval(() => cbRef.current(), time);
            return () => clearInterval(interval)
        }
    }, [time, play])
}