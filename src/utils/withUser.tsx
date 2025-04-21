import { useAppDispatch } from '@/redux/hooks';
import { setUserId } from '@/redux/userSlice';
import React, { useEffect } from 'react';

function withUser<P>(WrappedComponent: React.ComponentType<P>) {
    const ComponentWithLogger = (props: P) => {
        const dispatch = useAppDispatch()
        useEffect(() => {
            const userId = sessionStorage.getItem('userId');
            if (userId) {
                dispatch(setUserId(userId))
            } else {
                const newUserId = crypto.randomUUID();
                sessionStorage.setItem('userId', newUserId);
                dispatch(setUserId(newUserId))
            }
        }, [])

        
        return <WrappedComponent {...props} />;
    };

    return ComponentWithLogger;
}

export default withUser;