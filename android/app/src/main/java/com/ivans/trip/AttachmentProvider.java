package com.ivans.trip;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;

/** Shares only a selected cached attachment, with a temporary read grant. */
public final class AttachmentProvider extends ContentProvider {
    @Override public boolean onCreate(){return true;}
    private File file(Uri uri) throws FileNotFoundException {
        java.util.List<String> parts=uri.getPathSegments();
        if(parts.size()!=3||!parts.get(0).matches("[a-f0-9]{64}")||!parts.get(1).matches("[a-f0-9-]{36}"))throw new FileNotFoundException();
        try{
            File root=new File(getContext().getCacheDir(),"received").getCanonicalFile();
            File selected=new File(root,parts.get(0)+"/"+parts.get(1)+"/"+parts.get(2)).getCanonicalFile();
            if(!selected.getPath().startsWith(root.getPath()+File.separator)||!selected.isFile()||parts.get(2).equals("download.part"))throw new FileNotFoundException();
            return selected;
        }catch(java.io.IOException error){throw new FileNotFoundException();}
    }
    @Override public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException {
        if(!"r".equals(mode))throw new FileNotFoundException();
        return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public String getType(Uri uri){
        try{file(uri);java.util.List<String> parts=uri.getPathSegments();return getContext().getSharedPreferences("trip_files",0).getString(parts.get(0)+"/"+parts.get(1),"application/octet-stream");}catch(FileNotFoundException error){return null;}
    }
    @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String sort){
        try{File selected=file(uri);String[] columns=projection==null?new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE}:projection;MatrixCursor cursor=new MatrixCursor(columns);Object[] values=new Object[columns.length];for(int i=0;i<columns.length;i++){if(OpenableColumns.DISPLAY_NAME.equals(columns[i]))values[i]=selected.getName();else if(OpenableColumns.SIZE.equals(columns[i]))values[i]=selected.length();}cursor.addRow(values);return cursor;}catch(FileNotFoundException error){return null;}
    }
    @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}
    @Override public int update(Uri uri,ContentValues values,String selection,String[] args){throw new UnsupportedOperationException();}
    @Override public int delete(Uri uri,String selection,String[] args){throw new UnsupportedOperationException();}
}
