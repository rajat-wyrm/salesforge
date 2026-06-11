import React from 'react';
import OrganizationForm from '../../../components/Organizations/OrganizationForm';

// Reusing the Modal definition from above for simplicity in the demo
const Modal = ({ isOpen, onClose, title, children, maxWidth }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-70 p-4" onClick={onClose}>
            <div
                className={`bg-white rounded-lg shadow-2xl w-full ${maxWidth || 'max-w-xl'} max-h-[90vh] overflow-y-auto`}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full">X</button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const EditOrganization = ({ isOpen, onClose, onSave, organizationData }) => {
  if (!organizationData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Organization: ${organizationData.name}`}
      maxWidth="max-w-2xl"
    >
      <OrganizationForm
        // Pass the organization data to pre-fill the form
        orgToEdit={organizationData}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
};

export default EditOrganization;