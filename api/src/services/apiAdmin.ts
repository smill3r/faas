import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: `${process.env.APISIX_ADMIN_API_HOST}/apisix/admin`,
});
axiosInstance.defaults.headers.common['X-API-KEY'] = process.env.APISIX_ADMIN_API_PASSWORD || '';

export const axiosPut = async (uri: string, data: any)=> {
    return await axiosInstance.put(uri, data);
}

export const axiosGet = async (uri: string)=> {
    return await axiosInstance.get(uri);
}

