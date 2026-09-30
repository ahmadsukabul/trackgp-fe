// client.ts — pemetaan 1:1 seluruh route client BE trackgp.
// Semua fungsi mengembalikan ApiResponse<T> dari model/response.go BE:
//   { status, rc, message?, error_msg?, data }
// Endpoint: routes/route_client.go

import { apiFetch, apiFetchRaw, apiFetchPublic, type ApiResponse } from "./api";

/* ============ Types (selaras entities/*.go) ============ */

export interface Bisnis {
  id?: number;
  bisnis_id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  reseller_id?: string;
  device_limit: number;
  status: number;
  expired_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MembershipItem {
  bu_id: string;
  bisnis_id: string;
  name: string;
  status: string;
  role: string; // owner | tim
  role_id: string;
  role_name: string;
  menu_keys: string[];
  created_at: string;
}

export interface Member {
  bu_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  role_id: string;
  role_name: string;
  menu_keys: string[];
  status: string;
}

export interface Role {
  role_id: string;
  bisnis_id: string;
  name: string;
  description: string;
  menu_keys: string[];
  member_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface Device {
  id?: number;
  device_id: string;
  bisnis_id?: string;
  name: string;
  unique_id: string;
  protocol: string;
  model: string;
  manufacturer?: string;
  category: string;
  sim_number: string;
  phone_number: string;
  status: string;
  disabled: number;
  battery_level: number;
  course: number;
  speed_threshold: number;
  defense_state?: number;
  last_seen_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface Camera {
  id?: number;
  camera_id: string;
  bisnis_id?: string;
  device_id: string;
  name: string;
  serial_number: string;
  stream_url: string;
  channel: number;
  status: string;
  disabled: number;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id?: number;
  vehicle_id: string;
  bisnis_id?: string;
  name: string;
  license_plate: string;
  vehicle_type: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  vin_number: string;
  device_id: string;
  odometer_km: number;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface Driver {
  id?: number;
  driver_id: string;
  bisnis_id?: string;
  name: string;
  phone: string;
  email: string;
  license_no: string;
  license_exp: string;
  ibutton_id: string;
  photo_url?: string;
  status: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id?: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  photo_url?: string;
  disabled: number;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  bisnis_id: string;
  bisnis_name: string;
  member_role: string;
  menu_keys: string[];
  total_devices: number;
  total_vehicles: number;
  total_users: number;
  total_drivers: number;
}

/* ============ Auth ============ */
// POST /client/auth/login (publik)
export function authLogin(email: string, password: string): Promise<
  ApiResponse<{ token: string; user_id: string; name: string; email: string; phone: string }>
> {
  return apiFetchPublic("/client/auth/login", { email, password });
}

// POST /client/auth/me — profil + bisnis aktif & permission saat ini
export function authMe(): Promise<
  ApiResponse<{
    user_id: string;
    name: string;
    email: string;
    phone: string;
    photo_url: string;
    bisnis_id: string;
    member_role: string;
    menu_keys: string[];
  }>
> {
  return apiFetchRaw("/client/auth/me", {});
}

// POST /client/auth/bisnis — daftar bisnis milik user (untuk pemilihan bisnis)
export function authMyBisnis(): Promise<ApiResponse<MembershipItem[]>> {
  return apiFetchRaw("/client/auth/bisnis", {});
}

/* ============ Bisnis ============ */
// POST /client/bisnis/detail
export function bisnisDetail(): Promise<ApiResponse<Bisnis>> {
  return apiFetch("/client/bisnis/detail", {});
}

/* ============ Team: member ============ */
// POST /client/bisnis/member/list
export function memberList(): Promise<ApiResponse<Member[]>> {
  return apiFetch("/client/bisnis/member/list", {});
}

// POST /client/bisnis/member/add
export function memberAdd(payload: {
  email: string;
  role: string;
  role_id?: string | null;
}): Promise<ApiResponse<{ bu_id: string; user_id: string }>> {
  return apiFetch("/client/bisnis/member/add", payload);
}

// POST /client/bisnis/member/update
export function memberUpdate(payload: {
  bu_id: string;
  role?: string;
  role_id?: string | null;
  status?: string;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/bisnis/member/update", payload);
}

// POST /client/bisnis/member/delete
export function memberDelete(buId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/bisnis/member/delete", { bu_id: buId });
}

/* ============ Team: role granular ============ */
// POST /client/bisnis/role/list
export function roleList(): Promise<ApiResponse<Role[]>> {
  return apiFetch("/client/bisnis/role/list", {});
}

// POST /client/bisnis/role/detail
export function roleDetail(roleId: string): Promise<ApiResponse<Role>> {
  return apiFetch("/client/bisnis/role/detail", { role_id: roleId });
}

// POST /client/bisnis/role/add
export function roleCreate(payload: {
  name: string;
  description?: string;
  menu_keys: string[];
}): Promise<ApiResponse<{ role_id: string }>> {
  return apiFetch("/client/bisnis/role/add", payload);
}

// POST /client/bisnis/role/update
export function roleUpdate(payload: {
  role_id: string;
  name?: string;
  description?: string;
  menu_keys?: string[];
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/bisnis/role/update", payload);
}

// POST /client/bisnis/role/delete
export function roleDelete(roleId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/bisnis/role/delete", { role_id: roleId });
}

/* ============ Dashboard ============ */
// POST /client/dashboard/stats
export function dashboardStats(): Promise<ApiResponse<DashboardStats>> {
  return apiFetch("/client/dashboard/stats", {});
}

/* ============ GPS Device ============ */
// POST /client/device/list
export function deviceList(): Promise<ApiResponse<Device[]>> {
  return apiFetch("/client/device/list", {});
}

// POST /client/device/detail
export function deviceDetail(deviceId: string): Promise<ApiResponse<Device>> {
  return apiFetch("/client/device/detail", { device_id: deviceId });
}

// POST /client/device/add
export function deviceCreate(payload: {
  name: string;
  unique_id: string;
  protocol?: string;
  model?: string;
  category?: string;
  sim_number?: string;
  phone_number?: string;
}): Promise<ApiResponse<Device>> {
  return apiFetch("/client/device/add", payload);
}

// POST /client/device/update
export function deviceUpdate(payload: {
  device_id: string;
  name?: string;
  protocol?: string;
  model?: string;
  category?: string;
  sim_number?: string;
  phone_number?: string;
  speed_threshold?: number;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/device/update", payload);
}

// POST /client/device/delete
export function deviceDelete(deviceId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/device/delete", { device_id: deviceId });
}

/**
 * POST /client/device/positions — device + posisi terakhir (tbl_latest_position).
 * latitude/longitude bernilai 0 bila perangkat belum pernah mengirim fix GPS.
 */
export interface DevicePosition extends Device {
  latitude: number;
  longitude: number;
  speed: number;
  ignition: number;
  address: string;
  device_time: string;
}

export function devicePositions(): Promise<ApiResponse<DevicePosition[]>> {
  return apiFetch("/client/device/positions", {});
}

/* ============ Camera ============ */
// POST /client/camera/list — kirim device_id untuk memfilter kamera milik satu GPS
export function cameraList(deviceId?: string): Promise<ApiResponse<Camera[]>> {
  return apiFetch("/client/camera/list", deviceId ? { device_id: deviceId } : {});
}

// POST /client/camera/detail
export function cameraDetail(cameraId: string): Promise<ApiResponse<Camera>> {
  return apiFetch("/client/camera/detail", { camera_id: cameraId });
}

// POST /client/camera/add
export function cameraCreate(payload: {
  device_id: string;
  name: string;
  serial_number?: string;
  stream_url?: string;
  channel?: number;
}): Promise<ApiResponse<Camera>> {
  return apiFetch("/client/camera/add", payload);
}

// POST /client/camera/update
export function cameraUpdate(payload: {
  camera_id: string;
  name?: string;
  serial_number?: string;
  stream_url?: string;
  channel?: number;
  disabled?: number;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/camera/update", payload);
}

// POST /client/camera/delete
export function cameraDelete(cameraId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/camera/delete", { camera_id: cameraId });
}

/* ============ Vehicle ============ */
// POST /client/vehicle/list
export function vehicleList(): Promise<ApiResponse<Vehicle[]>> {
  return apiFetch("/client/vehicle/list", {});
}

// POST /client/vehicle/detail
export function vehicleDetail(vehicleId: string): Promise<ApiResponse<Vehicle>> {
  return apiFetch("/client/vehicle/detail", { vehicle_id: vehicleId });
}

// POST /client/vehicle/add
export function vehicleCreate(payload: {
  name: string;
  license_plate?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  vin_number?: string;
  device_id?: string;
  odometer_km?: number;
}): Promise<ApiResponse<Vehicle>> {
  return apiFetch("/client/vehicle/add", payload);
}

// POST /client/vehicle/update
export function vehicleUpdate(payload: {
  vehicle_id: string;
  name?: string;
  license_plate?: string;
  vehicle_type?: string;
  brand?: string;
  model?: string;
  year?: number;
  color?: string;
  vin_number?: string;
  device_id?: string;
  odometer_km?: number;
  status?: number;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/vehicle/update", payload);
}

// POST /client/vehicle/delete
export function vehicleDelete(vehicleId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/vehicle/delete", { vehicle_id: vehicleId });
}

/* ============ Driver ============ */
// POST /client/driver/list
export function driverList(): Promise<ApiResponse<Driver[]>> {
  return apiFetch("/client/driver/list", {});
}

// POST /client/driver/detail
export function driverDetail(driverId: string): Promise<ApiResponse<Driver>> {
  return apiFetch("/client/driver/detail", { driver_id: driverId });
}

// POST /client/driver/add
export function driverCreate(payload: {
  name: string;
  phone?: string;
  email?: string;
  license_no?: string;
  license_exp?: string;
  ibutton_id?: string;
}): Promise<ApiResponse<Driver>> {
  return apiFetch("/client/driver/add", payload);
}

// POST /client/driver/update
export function driverUpdate(payload: {
  driver_id: string;
  name?: string;
  phone?: string;
  email?: string;
  license_no?: string;
  license_exp?: string;
  ibutton_id?: string;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/driver/update", payload);
}

// POST /client/driver/delete
export function driverDelete(driverId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/driver/delete", { driver_id: driverId });
}

// POST /client/driver/assign-vehicles
export function driverAssignVehicles(
  driverId: string,
  vehicleIds: string[],
): Promise<ApiResponse<null>> {
  return apiFetch("/client/driver/assign-vehicles", {
    driver_id: driverId,
    vehicle_ids: vehicleIds,
  });
}

// POST /client/driver/vehicles
export interface VehicleAssignment {
  vehicle_id: string;
  driver_id: string;
  assigned_at: string;
}

export function driverVehicles(
  driverId: string,
): Promise<ApiResponse<VehicleAssignment[]>> {
  return apiFetch("/client/driver/vehicles", { driver_id: driverId });
}

/* ============ User ============ */
// POST /client/user/list
export function userList(name?: string): Promise<ApiResponse<User[]>> {
  return apiFetch("/client/user/list", name ? { name } : {});
}

// POST /client/user/detail
export function userDetail(userId: string): Promise<ApiResponse<User>> {
  return apiFetch("/client/user/detail", { user_id: userId });
}

// POST /client/user/add
export function userCreate(payload: {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  password?: string;
}): Promise<ApiResponse<User>> {
  return apiFetch("/client/user/add", payload);
}

// POST /client/user/update
export function userUpdate(payload: {
  user_id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  disabled?: number;
}): Promise<ApiResponse<null>> {
  return apiFetch("/client/user/update", payload);
}

// POST /client/user/delete
export function userDelete(userId: string): Promise<ApiResponse<null>> {
  return apiFetch("/client/user/delete", { user_id: userId });
}
