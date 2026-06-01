export interface UserCredential {
  username: string;
  password: string;
  deviceLimit: number;
  displayName: string;
}

export const userCredentials: UserCredential[] = [
  {
    username: "sb0",
    password: "0000",
    deviceLimit: 3,
    displayName: "SB User 0"
  },
  {
    username: "sb539",
    password: "1234",
    deviceLimit: 3,
    displayName: "SB User 539"
  },
  {
    username: "sb499",
    password: "5585",
    deviceLimit: 2,
    displayName: "Onkur Baidya"
  },
  {
    username: "sb1001",
    password: "7070",
    deviceLimit: 5,
    displayName: "Global Admin"
  },
  {
    username: "guest",
    password: "5555",
    deviceLimit: 1,
    displayName: "Guest Member"
  },
  {
    username: "operator",
    password: "9999",
    deviceLimit: 4,
    displayName: "Live Stream OP"
  },
  {
    username: "bangla_stream",
    password: "2026",
    deviceLimit: 3,
    displayName: "Bangla Premium TV"
  }
];
