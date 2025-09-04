'use client';

import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faUser, faEyeSlash, faEye, faDownload} from '@fortawesome/free-solid-svg-icons';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Badge} from '@/components/ui/badge';
import {Separator} from '@/components/ui/separator';
import {Employee} from '@/lib/supabase';
import {Avatar, AvatarImage, AvatarFallback} from "@/components/ui/avatar";

interface EmployeeDetailModalProps {
    employee: Employee | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function EmployeeDetailModal({employee, isOpen, onClose}: EmployeeDetailModalProps) {
    if (!employee) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faUser} className="text-blue-600"/>
                        Employee Details
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information for {employee.c_name || employee.e_name}
                    </DialogDescription>
                    <div className="flex items-center justify-center">
                        <div
                            className="relative overflow-hidden rounded-full hover:scale-110 transition-transform duration-300">
                            <Avatar className="w-100 h-100">
                                <AvatarImage
                                    src={`https://assistant.gss.com.tw/QuickSearchApi/image/renderemployeeimage/${employee.encrypt_emp_id}/default`}
                                    alt={`${employee.c_name || employee.e_name}的照片`}
                                />
                                <AvatarFallback>
                                    {(employee.c_name || employee.e_name)?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Basic Information</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-500">Employee ID:</span>
                                    <p className="font-medium">{employee.emp_id}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Chinese Name:</span>
                                    <p className="font-medium">{employee.c_name || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">English Name:</span>
                                    <p className="font-medium">{employee.e_name || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator/>

                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Position</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-500">Title:</span>
                                    <p className="font-medium">{employee.tit_name || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Department:</span>
                                    <p className="font-medium">{employee.dep_name_act || employee.dep_code || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Status:</span>
                                    <Badge variant="default" className="mt-1">
                                        {employee.job_status || 'Unknown'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Contact & Dates</h4>
                            <div className="space-y-2">
                                <div>
                                    <span className="text-sm text-gray-500">Office Extension:</span>
                                    <p className="font-medium">{employee.ofc_ext || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Company Entry Date:</span>
                                    <p className="font-medium">
                                        {employee.cmp_ent_dte ? new Date(employee.cmp_ent_dte).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Leave Expected Start:</span>
                                    <p className="font-medium">{employee.lev_exp_sdate || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <Separator/>

                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Privacy Settings</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon
                                        icon={employee.is_show_private_data ? faEye : faEyeSlash}
                                        className={employee.is_show_private_data ? "text-green-600" : "text-gray-400"}
                                    />
                                    <span className="text-sm">Show Private Data</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon
                                        icon={employee.is_show_download_photo ? faDownload : faEyeSlash}
                                        className={employee.is_show_download_photo ? "text-green-600" : "text-gray-400"}
                                    />
                                    <span className="text-sm">Allow Photo Download</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {employee.introduction && (
                    <>
                        <Separator/>
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Introduction</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{employee.introduction}</p>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}