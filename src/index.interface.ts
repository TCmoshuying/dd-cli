export interface DDTonken {
  errmsg: string;
  errcode: number;
  expires_in: number;
  access_token: string;
}

export interface Structure {
  key: string,
  moon?: number
  week?: number,
  Secret: string,
}

export interface GetStatusList {
  token?: string
  Substate?: string,
  sizeis?: string | number,
  offsetis?: string | number,
}

export interface Getdimission {
  token?: string
  sizeis?: string | number,
  offsetis?: string | number,
}
export interface GetKaoqingLists {
  time1: string,
  time2: string,
  start?: number,
  token?: string
  apiUrl?: string,
  useridList: any,
  limitis?: number,
  offsetis?: number,
  employeeList: any[],
}
