/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';

export const updateSettings = async (data, type) => {
  try {
    const url = type === 'password' ? 'updateMyPassword' : 'updateMe';

    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${url}`,
      data
    });

    if (res.data.status === 'Success') {
      showAlert('success', `${type.toUpperCase()} successfully updated!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
