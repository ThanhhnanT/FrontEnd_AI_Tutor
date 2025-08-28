import axios from 'axios'

const API_DOMAIN = "http://127.0.0.1:8000/"
const config = {
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
    withCredentials: true
}
export const get = async (path) => {
    try {
        const result = await axios.get(API_DOMAIN + path, { withCredentials: true });
        return result;
    } catch (e){
        if(e) {
            console.log(e.message)
        }
        else {
            alert("Network connect failed")
        }
    }
}

export const post = async (path, data) => {
    try {
        const res = await axios.post(API_DOMAIN + path, data, config);
        return res;
    } catch (e) {
        return e.response?.data || e.message; 
    }
};


export const patch = async (path, data) => {
    try{
        const res = await axios.patch(API_DOMAIN +path, data, config)
        return res
    } catch (e) {
        return e.response?.data || e.message; 
    }
}