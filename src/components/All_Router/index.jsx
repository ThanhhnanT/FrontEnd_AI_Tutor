import { routes } from "../../router";
import { useRoutes } from "react-router-dom";

function AllRoutes(){
    const element = useRoutes(routes);
    return(
        <>
            {element}
        </>
    )
}

export default AllRoutes;