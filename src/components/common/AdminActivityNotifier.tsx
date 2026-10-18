import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminActivityNotifier } from '../../services/adminActivityNotificationService';

/**
 * Global component that runs the real-time 'Admin Activity' toast notification system.
 * Only triggers for authenticated Staff / Super Admins / Admins when new profiles are submitted.
 */
export const AdminActivityNotifier: React.FC = () => {
  const navigate = useNavigate();
  useAdminActivityNotifier(navigate);
  return null;
};

export default AdminActivityNotifier;
