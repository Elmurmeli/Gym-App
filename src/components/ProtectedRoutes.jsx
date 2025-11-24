import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";

export default function ProtectedRoutes({ children }) {
    const [user, setUser] = useState(undefined);

    
    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
        });
    }, []);

    // While checking authentication state, show a loading spinner
    if (user === undefined) {
        return <p className="text-center mt-10">Loading...</p>;
    }
    
    // If user is not logged in, redirect to login
    if (!user) {
        return<Navigate to="/login" replace />;
    }

    //If user is logged in, show the protected components
    return children;

}