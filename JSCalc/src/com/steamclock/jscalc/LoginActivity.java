package com.steamclock.jscalc;

import android.app.Activity;
import android.os.Bundle;


import android.preference.EditTextPreference;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import java.io.IOException;
import java.io.Reader;

import junit.framework.Assert;

import org.mozilla.javascript.*;

import java.io.InputStream;
import java.io.InputStreamReader;


public class LoginActivity extends Activity {
    private static final String TAG = MainActivity.class.getName();

    public EditText userId;
    public EditText password;
    public EditText userIdMessages;
    public EditText passwordMessages;
    public EditText token;

    private Scriptable scope;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        userId = (EditText) findViewById(R.id.userId);
        password = (EditText) findViewById(R.id.password);
        userIdMessages = (EditText) findViewById(R.id.userIdMessages);
        passwordMessages = (EditText) findViewById(R.id.passwordMessages);

        setOnFocusChangeListener(userId, "userId");
        setOnFocusChangeListener(password, "password");

        initJs();
    }

    private void setOnFocusChangeListener(final EditText editText, final String name){

        editText.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            public void onFocusChange(View v, boolean hasFocus) {
                validateInput(editText, name);
            }
        });
    }


    private void validateInput( final EditText input, String name) {

        runInJSContext(new JSRunnable() {
            @Override
            public void run(Context cx) {
                if (input.getId() == R.id.userId) {
                    cx.evaluateString((Scriptable) scope, "window.model.userId = '" + input.getText() + "';", "setuserid", 1, null);
                    Object jsvalue = cx.evaluateString((Scriptable) scope, "window.model.getErrMessagesArray('userId').join(',');", "geterrmsgs", 1, null);
                    userIdMessages.setText(jsvalue.toString());
                } else {
                    cx.evaluateString((Scriptable) scope, "window.model.password = '" + input.getText() + "';", "setpassword", 1, null);
                    Object jsvalue = cx.evaluateString((Scriptable) scope, "window.model.getErrMessagesArray('password').join(',');", "geterrmsgs", 1, null);
                    passwordMessages.setText(jsvalue.toString());
                }
            }
        });
    }


    public void loginPressed(View loginBtn) {
        runInJSContext(new JSRunnable() {
            @Override
            public void run(Context cx) {
                cx.evaluateString((Scriptable) scope, "console.log(JSON.stringify(window.model));", "logg", 1, null);

                cx.evaluateString((Scriptable) scope, "window.model.login({success: function(m){console.log(m);}, error: function(a) {console.log(a)}});", "loginaction", 1, null);
            }
        });

    }

    public void initJs() {
        runInJSContext(new JSRunnable() {
            @Override
            public void run(Context cx) {
                scope = cx.initStandardObjects();

                //set up console.log
                putObject(new ConsoleWrapper(), "console");

                // load shim for XMLHttpRequest
                try {
                    Reader reader = getJSFileAsReader("rhino-shim.js");
                    cx.evaluateReader(scope, reader, "rhino-shim.js", 1, null);
                } catch (IOException e) {
                    e.printStackTrace();
                }

                //load the code
                try {
                    Reader reader = getJSFileAsReader("loginentry.js");
                    cx.evaluateReader(scope, reader, "initJs", 1, null);
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }

            private void putObject(Object javaObject, String jsName) {
                Object wrapper = Context.javaToJS(javaObject, scope);
                ScriptableObject.putProperty(scope, jsName, wrapper);
            }
        });
    }

    private Reader getJSFileAsReader(String filename) throws IOException {
        InputStream is = getAssets().open(filename);
        Log.d(TAG, "converting...");
        Reader reader = new InputStreamReader(is);
        return reader;
    }

    private void runInJSContext(JSRunnable code) {
        final Context cx = Context.enter();
        cx.setOptimizationLevel(-1); //needed for the stock rhino jar. TODO: try the ASE jar instead.
        try {
            code.run(cx);
        } catch (Exception ex) {
            Log.e(TAG, ex.toString());
        } finally {
            Context.exit();
        }
    }

    private interface JSRunnable {
        public void run(Context cx);
    }

    public class ConsoleWrapper {
        public void log(String text) {
            Log.d("js-console", text);
        }
        public void log(String text, String text1) {
            Log.d("js-console", text + text1);
        }
        public void log(String text, String text1, String text2) {
            Log.d("js-console", text+text1+text2);
        }
        public void log(String text, String text1, String text2, String text3) {
            Log.d("js-console", text+text1+text2+text3);
        }
        public void log(String text, String text1, String text2, String text3, String text4) {
            Log.d("js-console", text+text1+text2+text3+text4);
        }
    }





}